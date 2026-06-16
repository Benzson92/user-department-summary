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

  const allowed =
    departments && departments.length > 0 ? new Set(departments) : undefined;

  const shaped: DepartmentSummaryReportDto = {};

  for (const [department, summary] of Object.entries(report)) {
    if (allowed !== undefined && !allowed.has(department)) {
      continue;
    }

    const view: DepartmentSummaryDto = {
      male: summary.male,
      female: summary.female,
      ageRange: summary.ageRange,
      hair: summary.hair,
      ...(includeAddresses ? { userAddress: summary.userAddress } : {}),
    };

    shaped[department] = view;
  }

  return shaped;
};
