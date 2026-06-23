
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersController } from '@/modules/users/users.controller';
import { UsersService } from '@/modules/users/users.service';

import { GetDepartmentSummaryQueryDto } from '@/modules/users/dto/get-department-summary-query.dto';
import type { DepartmentSummaryReportDto } from '@/modules/users/dto/department-summary-response.dto';

describe('UsersController', () => {
  let controller: UsersController;

  const getDepartmentSummaryReport = vi.fn();
  const usersServiceMock: Pick<UsersService, 'getDepartmentSummaryReport'> = {
    getDepartmentSummaryReport,
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    }).compile();

    controller = moduleRef.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDepartmentSummary', () => {
    const query = {
      departments: ['engineering', 'finance'],
      includeAddresses: true,
    } as GetDepartmentSummaryQueryDto;

    const report = {
      generatedAt: '2026-06-22T00:00:00.000Z',
      departments: [],
    } as unknown as DepartmentSummaryReportDto;

    it('hands the query ticket to the service unchanged', async () => {
      getDepartmentSummaryReport.mockResolvedValue(report);

      await controller.getDepartmentSummary(query);

      expect(getDepartmentSummaryReport).toHaveBeenCalledTimes(1);
      expect(getDepartmentSummaryReport).toHaveBeenCalledWith(query);
    });

    it('serves back exactly what the service plates', async () => {
      getDepartmentSummaryReport.mockResolvedValue(report);

      const result = await controller.getDepartmentSummary(query);

      expect(result).toBe(report);
    });

    it('lets service errors bubble up to the framework', async () => {
      const kitchenFire = new Error('aggregation failed');
      getDepartmentSummaryReport.mockRejectedValue(kitchenFire);

      await expect(controller.getDepartmentSummary(query)).rejects.toThrow(
        kitchenFire,
      );
    });
  });
});