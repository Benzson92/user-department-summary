/**
 * Unit tests for UsersController.
 *
 * Kitchen analogy: the controller is the waiter at the pass. It takes the order
 * ticket (the query DTO), hands it to the kitchen (UsersService), and serves
 * back exactly what was plated. These tests make sure the waiter doesn't garble
 * the ticket on the way in or swap the dish on the way out — the actual cooking
 * (aggregation, pagination, fan-out) is the service's job and is tested there.
 */

// Testing framework
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

// Module under test
import { UsersController } from '@/modules/users/users.controller';
import { UsersService } from '@/modules/users/users.service';

// DTOs
import { GetDepartmentSummaryQueryDto } from '@/modules/users/dto/get-department-summary-query.dto';
import type { DepartmentSummaryReportDto } from '@/modules/users/dto/department-summary-response.dto';

describe('UsersController', () => {
  let controller: UsersController;

  // The "kitchen" — a stand-in service so we test the waiter, not the cooking.
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
    // A representative order ticket — adjust to match your real DTO shape.
    const query = {
      departments: ['engineering', 'finance'],
      includeAddresses: true,
    } as GetDepartmentSummaryQueryDto;

    // A representative plated dish — opaque to the controller, it just passes through.
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

      // Same reference — the controller adds no seasoning of its own.
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