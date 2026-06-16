import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock, MockInstance } from 'vitest';

import { HttpService } from '@nestjs/axios';
import { Logger, ServiceUnavailableException } from '@nestjs/common';

import { from, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import type { AxiosResponse } from 'axios';

import type { DummyJsonUser, DummyJsonUsersResponse } from '@/modules/users/types/user.types';

import { GetDepartmentSummaryQueryDto } from '@/modules/users/dto/get-department-summary-query.dto';
import type { DepartmentSummaryReportDto } from '@/modules/users/dto/department-summary-response.dto';

import { aggregateUsersByDepartment } from '@/modules/users/aggregate-users-by-department';
import { applyQueryToReport } from '@/modules/users/apply-query-to-report';

import { UsersService } from '@/modules/users/users.service';

vi.mock('@/modules/users/aggregate-users-by-department', () => ({
  aggregateUsersByDepartment: vi.fn(),
}));

vi.mock('@/modules/users/apply-query-to-report', () => ({
  applyQueryToReport: vi.fn(),
}));

const PAGE_SIZE = 50;

const EXPECTED_SELECT = 'firstName,lastName,age,gender,hair,address,company';

const GENERIC_FAILURE_MESSAGE =
  'The user directory is temporarily unavailable. Please try again later.';

interface HttpGetConfig {
  readonly params: {
    readonly limit: number;
    readonly skip: number;
    readonly select: string;
  };
  readonly signal?: AbortSignal;
}

const buildUser = (id: number): DummyJsonUser =>
  ({
    firstName: `First${id}`,
    lastName: `Last${id}`,
    age: 30,
    gender: 'female',
    hair: { color: 'Brown', type: 'Curly' },
    address: { state: 'Bangkok' },
    company: { department: 'Engineering', title: 'Engineer' },
  }) as unknown as DummyJsonUser;

const buildPage = (
  users: ReadonlyArray<DummyJsonUser>,
  total: number,
  skip: number,
): DummyJsonUsersResponse =>
  ({
    users,
    total,
    skip,
    limit: PAGE_SIZE,
  }) as unknown as DummyJsonUsersResponse;

const asAxiosResponse = (
  data: DummyJsonUsersResponse,
): AxiosResponse<DummyJsonUsersResponse> =>
  ({ data }) as AxiosResponse<DummyJsonUsersResponse>;

const AGGREGATED_REPORT = {
  __sentinel: 'aggregated',
} as unknown as ReturnType<typeof aggregateUsersByDepartment>;

const FINAL_REPORT = {
  __sentinel: 'final',
} as unknown as DepartmentSummaryReportDto;

const QUERY = Object.freeze({}) as GetDepartmentSummaryQueryDto;

describe('UsersService', () => {
  let httpGetMock: Mock;
  let loggerErrorSpy: MockInstance;
  let service: UsersService;

  const givenUserDirectory = (total: number): ReadonlyArray<DummyJsonUser> => {
    const allUsers = Array.from({ length: total }, (_, index) => buildUser(index));

    httpGetMock.mockImplementation((_url: string, config: HttpGetConfig) => {
      const { skip, limit } = config.params;
      const pageUsers = allUsers.slice(skip, skip + limit);
      return of(asAxiosResponse(buildPage(pageUsers, total, skip)));
    });

    return allUsers;
  };

  const requestedSkips = (): ReadonlyArray<number> =>
    (httpGetMock.mock.calls as Array<[string, HttpGetConfig]>).map(
      ([, config]) => config.params.skip,
    );

  beforeEach(() => {
    loggerErrorSpy = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    httpGetMock = vi.fn();
    const httpService = { get: httpGetMock } as unknown as HttpService;

    service = new UsersService(httpService);

    vi.mocked(aggregateUsersByDepartment).mockReturnValue(AGGREGATED_REPORT);
    vi.mocked(applyQueryToReport).mockReturnValue(FINAL_REPORT);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDepartmentSummaryReport — orchestration', () => {
    it('pipes fetched users through aggregation, shapes with the query, and returns the result', async () => {
      const allUsers = givenUserDirectory(3);

      const report = await service.getDepartmentSummaryReport(QUERY);

      expect(aggregateUsersByDepartment).toHaveBeenCalledTimes(1);
      expect(aggregateUsersByDepartment).toHaveBeenCalledWith(allUsers);

      expect(applyQueryToReport).toHaveBeenCalledTimes(1);
      expect(applyQueryToReport).toHaveBeenCalledWith(AGGREGATED_REPORT, QUERY);

      expect(report).toBe(FINAL_REPORT);
    });
  });

  describe('pagination strategy (probe → fan out → stitch)', () => {
    it('fetches a single page when the directory fits exactly within one page', async () => {
      const allUsers = givenUserDirectory(PAGE_SIZE); 

      const report = await service.getDepartmentSummaryReport(QUERY);

      expect(httpGetMock).toHaveBeenCalledTimes(1);
      expect(aggregateUsersByDepartment).toHaveBeenCalledWith(allUsers);
      expect(report).toBe(FINAL_REPORT);
    });

    it('handles an empty directory with the probe alone', async () => {
      givenUserDirectory(0);

      await service.getDepartmentSummaryReport(QUERY);

      expect(httpGetMock).toHaveBeenCalledTimes(1);
      expect(aggregateUsersByDepartment).toHaveBeenCalledWith([]);
    });

    it('fans out as soon as the total spills past one page', async () => {
      givenUserDirectory(PAGE_SIZE + 1); 

      await service.getDepartmentSummaryReport(QUERY);

      expect(httpGetMock).toHaveBeenCalledTimes(2);
      expect(requestedSkips()).toEqual([0, PAGE_SIZE]);
    });

    it('probes the first page, then fans out to every remaining offset', async () => {
      givenUserDirectory(208); 

      await service.getDepartmentSummaryReport(QUERY);

      expect(requestedSkips()).toEqual([0, 50, 100, 150, 200]);
    });

    it('issues all fan-out requests concurrently after the probe', async () => {
      const total = 208;
      const resolvers = new Map<number, () => void>();

      httpGetMock.mockImplementation((_url: string, config: HttpGetConfig) => {
        const { skip } = config.params;

        if (skip === 0) {
          return of(asAxiosResponse(buildPage([buildUser(0)], total, 0)));
        }

        return from(
          new Promise<AxiosResponse<DummyJsonUsersResponse>>((resolve) => {
            resolvers.set(skip, () =>
              resolve(asAxiosResponse(buildPage([buildUser(skip)], total, skip))),
            );
          }),
        );
      });

      const reportPromise = service.getDepartmentSummaryReport(QUERY);

      await vi.waitFor(() => expect(httpGetMock).toHaveBeenCalledTimes(5));

      for (const release of resolvers.values()) {
        release();
      }

      await expect(reportPromise).resolves.toBe(FINAL_REPORT);
    });

    it('stitches pages in offset order even when fan-out responses land out of order', async () => {
      const total = PAGE_SIZE * 3; 
      const allUsers = givenUserDirectory(total);

      const delayBySkip: Record<number, number> = { 0: 0, 50: 40, 100: 5 };

      httpGetMock.mockImplementation((_url: string, config: HttpGetConfig) => {
        const { skip, limit } = config.params;
        const page = buildPage(allUsers.slice(skip, skip + limit), total, skip);
        const response$ = of(asAxiosResponse(page));
        const delayMs = delayBySkip[skip] ?? 0;
        return delayMs > 0 ? response$.pipe(delay(delayMs)) : response$;
      });

      await service.getDepartmentSummaryReport(QUERY);

      expect(aggregateUsersByDepartment).toHaveBeenCalledWith(allUsers);
    });
  });

  describe('request shaping', () => {
    it('projects only the required fields and uses the service page size on every request', async () => {
      givenUserDirectory(PAGE_SIZE * 2); 

      await service.getDepartmentSummaryReport(QUERY);

      expect(httpGetMock).toHaveBeenCalledTimes(2);

      for (const call of httpGetMock.mock.calls as Array<[string, HttpGetConfig]>) {
        const [url, config] = call;
        expect(url).toBe('/users');
        expect(config.params.limit).toBe(PAGE_SIZE);
        expect(config.params.select).toBe(EXPECTED_SELECT);
      }
    });
  });

  describe('failure semantics (all-or-nothing)', () => {
    it('maps a failed probe to a 503 without leaking upstream details', async () => {
      const upstreamError = new Error('ECONNREFUSED 10.0.0.7:443 (internal-gateway)');
      httpGetMock.mockReturnValue(throwError(() => upstreamError));

      const caught = await service
        .getDepartmentSummaryReport(QUERY)
        .then(() => {
          throw new Error('Expected the report to reject, but it resolved.');
        })
        .catch((error: unknown) => error as ServiceUnavailableException);

      expect(caught).toBeInstanceOf(ServiceUnavailableException);
      expect(caught.message).toBe(GENERIC_FAILURE_MESSAGE);
      expect(caught.message).not.toContain('ECONNREFUSED');

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch users from upstream provider.',
        upstreamError,
      );
    });

    it('fails the entire report when any single fan-out page fails', async () => {
      givenUserDirectory(208); 
      const happyImplementation = httpGetMock.getMockImplementation()!;

      const poisonedSkip = 100;
      httpGetMock.mockImplementation((url: string, config: HttpGetConfig) =>
        config.params.skip === poisonedSkip
          ? throwError(() => new Error('upstream 500'))
          : happyImplementation(url, config),
      );

      await expect(service.getDepartmentSummaryReport(QUERY)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );

      expect(aggregateUsersByDepartment).not.toHaveBeenCalled();
    });

    it('rejects with a 503 when a page arrives without a users array', async () => {
      httpGetMock.mockReturnValue(
        of(asAxiosResponse({ total: 10 } as unknown as DummyJsonUsersResponse)),
      );

      await expect(service.getDepartmentSummaryReport(QUERY)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(aggregateUsersByDepartment).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('rejects with a 503 when a page reports a non-finite total', async () => {
      httpGetMock.mockReturnValue(
        of(asAxiosResponse(buildPage([buildUser(1)], Number.NaN, 0))),
      );

      await expect(service.getDepartmentSummaryReport(QUERY)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(aggregateUsersByDepartment).not.toHaveBeenCalled();
    });

    it('rejects with a 503 when a page reports a negative total', async () => {
      httpGetMock.mockReturnValue(
        of(asAxiosResponse(buildPage([buildUser(1)], -1, 0))),
      );

      await expect(service.getDepartmentSummaryReport(QUERY)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(aggregateUsersByDepartment).not.toHaveBeenCalled();
    });
  });
});