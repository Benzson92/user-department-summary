/**
 * The PUBLIC output contract — what the endpoint promises to return.
 *
 * It DERIVES from the internal `DepartmentSummary` via `Omit`, overriding only
 * the field that differs at the boundary: `userAddress` is OPTIONAL here (it is
 * included only when the caller opts in via `includeAddresses`), whereas
 * internally it is always computed and therefore required.
 *
 * Trade-off of deriving: the DTO automatically tracks `DepartmentSummary`, so
 * the shared fields are never duplicated — but any field added to the internal
 * type will ALSO surface on this public contract. That coupling is intentional
 * here; if the public surface must stay insulated from internal changes, switch
 * back to a standalone interface that re-declares its own fields.
 *
 * It is an `interface` (not a class) because this shape carries no runtime
 * metadata — never instantiated, validated, or serialised via decorators.
 */

// --- Domain types ---
import type { DepartmentSummary, UserAddress } from '../types/department-summary.types';

/** The exposed summary for ONE department: the internal summary, address optional. */
export interface DepartmentSummaryDto extends Omit<DepartmentSummary, 'userAddress'> {
  /** Present only when the caller requested addresses; omitted otherwise. */
  readonly userAddress?: UserAddress;
}

/** The full report the endpoint returns, keyed by department name. */
export type DepartmentSummaryReportDto = Record<string, DepartmentSummaryDto>;
