// --- Framework ---
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

// --- Libraries ---
import { firstValueFrom } from 'rxjs';

// --- Domain types ---
import type { DummyJsonUser, DummyJsonUsersResponse } from './types/user.types';

// --- DTO contracts ---
import type { GetDepartmentSummaryQueryDto } from './dto/get-department-summary-query.dto';
import type { DepartmentSummaryReportDto } from './dto/department-summary-response.dto';

// --- Domain logic ---
import { aggregateUsersByDepartment } from './aggregate-users-by-department';
import { applyQueryToReport } from './apply-query-to-report';

/**
 * Named options for a single page fetch.
 *
 * The options object — rather than positional arguments — is the
 * extensibility seam: new knobs (`limit`, `select`, `signal`, future retry
 * hints) can be added later without breaking or reordering existing call
 * sites. Only `skip` is required, because a page is addressed by its offset;
 * everything else has a sensible service-level default.
 */
interface FetchUsersPageOptions {
  /** Offset into the upstream collection. */
  readonly skip: number;

  /** Page size override. Defaults to `UsersService.PAGE_SIZE`. */
  readonly limit?: number;

  /** Field projection override. Defaults to `UsersService.REQUIRED_FIELDS`. */
  readonly select?: ReadonlyArray<string>;

  /** Cooperative cancellation: aborts the in-flight request if signalled. */
  readonly signal?: AbortSignal;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  /**
   * Ask the API for ONLY the fields we transform. A narrower payload means
   * fewer bytes over the wire and less JSON to parse — a free performance win
   * and a small attack-surface reduction (we never even receive data we ignore).
   */
  private static readonly REQUIRED_FIELDS: ReadonlyArray<string> = [
    'firstName',
    'lastName',
    'age',
    'gender',
    'hair',
    'address',
    'company',
  ];

  /**
   * How many users we pull per request. Small enough that no single response
   * is heavy, large enough that the page count stays low. With dummyjson's
   * ~208 users this yields 5 pages — 1 sequential "probe" + 4 in parallel.
   */
  private static readonly PAGE_SIZE = 50;

  constructor(private readonly httpService: HttpService) {}

  /**
   * The single public entry point: fetch every user, fold them into a
   * department-keyed summary, then shape that summary to the caller's query.
   * Each step is isolated so it can be reasoned about — and tested — alone.
   */
  public async getDepartmentSummaryReport(
    query: GetDepartmentSummaryQueryDto,
  ): Promise<DepartmentSummaryReportDto> {
    const users = await this.fetchAllUsers();
    const report = aggregateUsersByDepartment(users);
    return applyQueryToReport(report, query);
  }

  /**
   * Fetch the full user directory via parallel pagination.
   *
   * Strategy:
   *   1. PROBE  — fetch page 1 sequentially. It does double duty: it delivers
   *      the first batch of users AND tells us `total`, which we need to plan
   *      the remaining work.
   *   2. FAN OUT — every other page is addressed purely by `skip`/`limit`, so
   *      the requests are independent and can all be in flight at once.
   *   3. STITCH  — `Promise.all` resolves in input order (regardless of which
   *      response lands first), so flattening yields a deterministic,
   *      offset-ordered user list.
   *
   * Failure semantics are all-or-nothing: if ANY page fails, `Promise.all`
   * rejects and we surface a 503. A department report built from partial data
   * would be silently wrong, which is worse than being loudly unavailable.
   */
  private async fetchAllUsers(): Promise<ReadonlyArray<DummyJsonUser>> {
    try {
      // 1. Probe: first page + total count in one round trip.
      const firstPage = await this.fetchUsersPage({ skip: 0 });

      const pageSize = UsersService.PAGE_SIZE;
      const totalPages = Math.ceil(firstPage.total / pageSize);

      // Zero or one page of data — the probe already has everything.
      if (totalPages <= 1) {
        return firstPage.users;
      }

      // 2. Fan out: compute every remaining offset and fire all requests at once.
      const remainingSkips = Array.from(
        { length: totalPages - 1 },
        (_, index) => (index + 1) * pageSize,
      );

      const remainingPages = await Promise.all(
        remainingSkips.map((skip) => this.fetchUsersPage({ skip })),
      );

      // 3. Stitch: pages are already in offset order; flatten into one list.
      return [firstPage, ...remainingPages].flatMap((page) => page.users);
    } catch (error) {
      // Log the real cause internally for debugging, but expose a clean,
      // generic message to callers so we never leak upstream/internal details.
      this.logger.error(
        'Failed to fetch users from upstream provider.',
        error as Error,
      );
      throw new ServiceUnavailableException(
        'The user directory is temporarily unavailable. Please try again later.',
      );
    }
  }

  /**
   * Fetch a single page of users.
   *
   * Defaults are resolved here, at the lowest level, so callers only state
   * what they want to override. Validation also lives here — at the trust
   * boundary — so every page entering the pipeline is guaranteed well-formed,
   * no matter which call site (probe or fan-out) requested it. The HTTP-level
   * safeguards (timeout, size cap) are configured once in `UsersModule`, so
   * they apply automatically here.
   */
  private async fetchUsersPage(
    options: FetchUsersPageOptions,
  ): Promise<DummyJsonUsersResponse> {
    const {
      skip,
      limit = UsersService.PAGE_SIZE,
      select = UsersService.REQUIRED_FIELDS,
      signal,
    } = options;

    const response = await firstValueFrom(
      this.httpService.get<DummyJsonUsersResponse>('/users', {
        params: {
          limit,
          skip,
          select: select.join(','),
        },
        signal,
      }),
    );

    const page = response.data;

    // Defensive validation: never trust the shape of upstream data blindly.
    if (!page || !Array.isArray(page.users)) {
      throw new Error(
        `Upstream page at skip=${skip} did not contain a users array.`,
      );
    }

    if (!Number.isFinite(page.total) || page.total < 0) {
      throw new Error(
        `Upstream page at skip=${skip} reported an invalid total: ${String(page.total)}.`,
      );
    }

    return page;
  }
}