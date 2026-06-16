// --- Domain types ---
import type { DepartmentSummaryReport } from './types/department-summary.types';

// --- DTO contracts ---
import type { GetDepartmentSummaryQueryDto } from './dto/get-department-summary-query.dto';
import type {
  DepartmentSummaryDto,
  DepartmentSummaryReportDto,
} from './dto/department-summary-response.dto';

/**
 * Project the internal report onto the public contract, honouring the query.
 *
 * Two concerns, applied in one pass over the departments:
 *   1. FILTER  — if `departments` was supplied, keep only those entries.
 *   2. REDACT  — drop the `userAddress` (PII) unless `includeAddresses` is true.
 *
 * This stays PURE (new object out, input untouched) so it is trivially testable
 * and so the service can remain a thin orchestrator: fetch -> transform -> shape.
 */
export const applyQueryToReport = (
  report: DepartmentSummaryReport,
  query: GetDepartmentSummaryQueryDto,
): DepartmentSummaryReportDto => {
  const { departments, includeAddresses } = query;

  // A Set gives O(1) membership checks instead of scanning an array per entry.
  const allowed =
    departments && departments.length > 0 ? new Set(departments) : undefined;

  const shaped: DepartmentSummaryReportDto = {};

  for (const [department, summary] of Object.entries(report)) {
    if (allowed !== undefined && !allowed.has(department)) {
      continue; // filtered out by the caller's `departments` list
    }

    const view: DepartmentSummaryDto = {
      male: summary.male,
      female: summary.female,
      ageRange: summary.ageRange,
      hair: summary.hair,
      // Only attach the PII address book when explicitly requested.
      ...(includeAddresses ? { userAddress: summary.userAddress } : {}),
    };

    shaped[department] = view;
  }

  return shaped;
};
