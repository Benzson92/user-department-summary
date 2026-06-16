// --- Framework ---
import { Controller, Get, Query } from '@nestjs/common';

// --- DTO contracts ---
import { GetDepartmentSummaryQueryDto } from './dto/get-department-summary-query.dto';
import type { DepartmentSummaryReportDto } from './dto/department-summary-response.dto';

// --- Domain services ---
import { UsersService } from './users.service';

/**
 * The controller is the kitchen "pass" — the window where finished dishes
 * leave the kitchen. It stays deliberately thin: read the validated order
 * ticket (the query DTO) and hand it straight to the service. No logic here.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/department-summary?departments=...&includeAddresses=...
  @Get('department-summary')
  public getDepartmentSummary(
    @Query() query: GetDepartmentSummaryQueryDto,
  ): Promise<DepartmentSummaryReportDto> {
    return this.usersService.getDepartmentSummaryReport(query);
  }
}
