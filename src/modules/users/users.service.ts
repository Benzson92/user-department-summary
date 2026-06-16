import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import { firstValueFrom } from 'rxjs';

import type { DummyJsonUser, DummyJsonUsersResponse } from './types/user.types';

import type { GetDepartmentSummaryQueryDto } from './dto/get-department-summary-query.dto';
import type { DepartmentSummaryReportDto } from './dto/department-summary-response.dto';

import { aggregateUsersByDepartment } from './aggregate-users-by-department';
import { applyQueryToReport } from './apply-query-to-report';

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

  private static readonly REQUIRED_FIELDS: ReadonlyArray<string> = [
    'firstName',
    'lastName',
    'age',
    'gender',
    'hair',
    'address',
    'company',
  ];

  private static readonly PAGE_SIZE = 50;

  constructor(private readonly httpService: HttpService) {}

  public async getDepartmentSummaryReport(
    query: GetDepartmentSummaryQueryDto,
  ): Promise<DepartmentSummaryReportDto> {
    const users = await this.fetchAllUsers();
    const report = aggregateUsersByDepartment(users);
    return applyQueryToReport(report, query);
  }

  private async fetchAllUsers(): Promise<ReadonlyArray<DummyJsonUser>> {
    try {
      const firstPage = await this.fetchUsersPage({ skip: 0 });

      const pageSize = UsersService.PAGE_SIZE;
      const totalPages = Math.ceil(firstPage.total / pageSize);

      if (totalPages <= 1) {
        return firstPage.users;
      }

      const remainingSkips = Array.from(
        { length: totalPages - 1 },
        (_, index) => (index + 1) * pageSize,
      );

      const remainingPages = await Promise.all(
        remainingSkips.map((skip) => this.fetchUsersPage({ skip })),
      );

      return [firstPage, ...remainingPages].flatMap((page) => page.users);
    } catch (error) {
      this.logger.error(
        'Failed to fetch users from upstream provider.',
        error as Error,
      );
      throw new ServiceUnavailableException(
        'The user directory is temporarily unavailable. Please try again later.',
      );
    }
  }

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