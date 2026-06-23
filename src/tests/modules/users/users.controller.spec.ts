
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from '@/modules/users/users.controller';
import { UsersService } from '@/modules/users/users.service';

import { GetDepartmentSummaryQueryDto } from '@/modules/users/dto/get-department-summary-query.dto';
import type { DepartmentSummaryReportDto } from '@/modules/users/dto/department-summary-response.dto';

describe('UsersController', () => {
  let usersController: UsersController;

  const mockGetDepartmentSummaryReport = vi.fn();

  const mockUsersService: Pick<
    UsersService,
    'getDepartmentSummaryReport'
  > = {
    getDepartmentSummaryReport: mockGetDepartmentSummaryReport,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const testingModule: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    usersController = testingModule.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('getDepartmentSummary', () => {
    const departmentSummaryQuery: GetDepartmentSummaryQueryDto = {
      departments: ['engineering', 'finance'],
      includeAddresses: true,
    };

    const mockDepartmentSummaryReport = {
      generatedAt: '2026-06-22T00:00:00.000Z',
      departments: [],
    } as unknown as DepartmentSummaryReportDto;

    it('should call the service with the provided query', async () => {
      mockGetDepartmentSummaryReport.mockResolvedValue(
        mockDepartmentSummaryReport,
      );

      await usersController.getDepartmentSummary(
        departmentSummaryQuery,
      );

      expect(mockGetDepartmentSummaryReport).toHaveBeenCalledTimes(1);

      expect(mockGetDepartmentSummaryReport).toHaveBeenCalledWith(
        departmentSummaryQuery,
      );
    });

    it('should return the report returned by the service', async () => {
      mockGetDepartmentSummaryReport.mockResolvedValue(
        mockDepartmentSummaryReport,
      );

      const returnedDepartmentSummaryReport =
        await usersController.getDepartmentSummary(
          departmentSummaryQuery,
        );

      expect(returnedDepartmentSummaryReport).toBe(
        mockDepartmentSummaryReport,
      );
    });

    it('should propagate service errors', async () => {
      const aggregationError = new Error('aggregation failed');

      mockGetDepartmentSummaryReport.mockRejectedValue(
        aggregationError,
      );

      await expect(
        usersController.getDepartmentSummary(
          departmentSummaryQuery,
        ),
      ).rejects.toThrow(aggregationError);
    });
  });
});