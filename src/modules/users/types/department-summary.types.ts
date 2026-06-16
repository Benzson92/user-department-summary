/**
 * The shapes of the FINISHED dish — the report we hand back to the caller —
 * plus the private working data we accumulate while cooking.
 *
 * We deliberately separate two concerns:
 *   1. `DepartmentSummaryData`   -> the working notepad (mutable, internal).
 *   2. `DepartmentSummary`       -> the printed prep card (readonly, public).
 *
 * Keeping a numeric `minAge` / `maxAge` on the working data lets us update the age
 * range in a single comparison per user, then format it into the final
 * "26-50" string exactly once at the end.
 */

/** "Black" -> 4, "Blond" -> 2, ... a tally of hair colours within a department. */
export type HairColorCount = Record<string, number>;

/** "TerryMedhurst" -> "47225" — full name mapped to postal code. */
export type UserAddress = Record<string, string>;

/** The public, immutable summary for ONE department. */
export interface DepartmentSummary {
  readonly male: number;
  readonly female: number;
  readonly ageRange: string;
  readonly hair: HairColorCount;
  readonly userAddress: UserAddress;
}

/** The full report keyed by department name. */
export type DepartmentSummaryReport = Record<string, DepartmentSummary>;

/**
 * The internal accumulator — the SUMMARY DATA we build up as we walk the users.
 * It is intentionally mutable and NOT exported as part of the public contract:
 * it is the chef's scratch pad, not the menu. `minAge`/`maxAge` stay numeric
 * here so we can compare cheaply; only at the very end do we turn them into the
 * human-readable `ageRange` string.
 */
export interface DepartmentSummaryData {
  male: number;
  female: number;
  minAge: number;
  maxAge: number;
  hair: HairColorCount;
  userAddress: UserAddress;
}
