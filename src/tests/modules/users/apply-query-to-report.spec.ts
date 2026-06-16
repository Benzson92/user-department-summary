import { describe, expect, it } from 'vitest';

import { applyQueryToReport } from '@/modules/users/apply-query-to-report';

import type { DepartmentSummaryReport } from '@/modules/users/types/department-summary.types';

import { GetDepartmentSummaryQueryDto } from '@/modules/users/dto/get-department-summary-query.dto';

const REPORT: DepartmentSummaryReport = {
  Engineering: {
    male: 2,
    female: 1,
    ageRange: '25-40',
    hair: { Black: 2, Blond: 1 },
    userAddress: { AdaLovelace: '11111', AlanTuring: '22222' },
  },
  Marketing: {
    male: 1,
    female: 1,
    ageRange: '30-45',
    hair: { Brown: 2 },
    userAddress: { GraceHopper: '33333' },
  },
};

const makeQuery = (
  overrides: Partial<GetDepartmentSummaryQueryDto> = {},
): GetDepartmentSummaryQueryDto =>
  Object.assign(new GetDepartmentSummaryQueryDto(), overrides);

describe('applyQueryToReport', () => {
  it('redacts addresses by default', () => {
    const result = applyQueryToReport(REPORT, makeQuery());

    expect(result.Engineering).not.toHaveProperty('userAddress');
    expect(result.Marketing).not.toHaveProperty('userAddress');
    // Non-PII fields are preserved untouched.
    expect(result.Engineering?.hair).toEqual({ Black: 2, Blond: 1 });
  });

  it('keeps addresses when includeAddresses is true', () => {
    const result = applyQueryToReport(REPORT, makeQuery({ includeAddresses: true }));

    expect(result.Engineering?.userAddress).toEqual({
      AdaLovelace: '11111',
      AlanTuring: '22222',
    });
  });

  it('filters to only the requested departments', () => {
    const result = applyQueryToReport(REPORT, makeQuery({ departments: ['Marketing'] }));

    expect(Object.keys(result)).toEqual(['Marketing']);
  });

  it('returns an empty report when the filter matches nothing', () => {
    const result = applyQueryToReport(REPORT, makeQuery({ departments: ['Legal'] }));

    expect(result).toEqual({});
  });

  it('does not mutate the input report', () => {
    const snapshot = JSON.parse(JSON.stringify(REPORT));

    applyQueryToReport(REPORT, makeQuery({ includeAddresses: true, departments: ['Engineering'] }));

    expect(REPORT).toEqual(snapshot);
  });
});