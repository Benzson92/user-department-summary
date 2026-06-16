import { Controller, Get, Query } from '@nestjs/common';

import { GetDepartmentSummaryQueryDto } from './dto/get-department-summary-query.dto';
import type { DepartmentSummaryReportDto } from './dto/department-summary-response.dto';

import { UsersService } from './users.service';

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
