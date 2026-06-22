import type { DepartmentSummaryReport } from './types/department-summary.types';

import type { GetDepartmentSummaryQueryDto } from './dto/get-department-summary-query.dto';
import type {
  DepartmentSummaryDto,
  DepartmentSummaryReportDto,
} from './dto/department-summary-response.dto';

export const applyQueryToReport = (
  report: DepartmentSummaryReport,
  query: GetDepartmentSummaryQueryDto,
): DepartmentSummaryReportDto => {
  const { departments, includeAddresses } = query;

  const requestedDepartments =
    departments && departments.length > 0 ? new Set(departments) : undefined;

  const filteredReport: DepartmentSummaryReportDto = {};

  for (const [departmentName, reportSummary] of Object.entries(report)) {
    if (requestedDepartments !== undefined && !requestedDepartments.has(departmentName)) {
      continue;
    }

    const departmentSummary: DepartmentSummaryDto = {
      male: reportSummary.male,
      female: reportSummary.female,
      ageRange: reportSummary.ageRange,
      hair: reportSummary.hair,
      ...(includeAddresses ? { userAddress: reportSummary.userAddress } : {}),
    };

    filteredReport[departmentName] = departmentSummary;
  }

  return filteredReport;
};
