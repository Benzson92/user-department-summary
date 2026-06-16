
import type { DepartmentSummary, UserAddress } from '../types/department-summary.types';

export interface DepartmentSummaryDto extends Omit<DepartmentSummary, 'userAddress'> {
  /** Present only when the caller requested addresses; omitted otherwise. */
  readonly userAddress?: UserAddress;
}

export type DepartmentSummaryReportDto = Record<string, DepartmentSummaryDto>;
