// --- Libraries ---
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

// --- Utils ---
import { toBoolean, toStringArray } from '@/utils/query-param-parser';

/**
 * The contract for `GET /users/department-summary?...`.
 *
 * This class IS the order ticket: every field a caller is allowed to send is
 * declared here, typed, and validated. Anything not on the ticket is rejected
 * by the global ValidationPipe — the kitchen does not improvise off-menu.
 *
 * Query values arrive as strings, so each field runs a `@Transform` (from the
 * shared `query-param-parser` utils) to normalise the raw value BEFORE validation.
 */
export class GetDepartmentSummaryQueryDto {
  /**
   * Optional filter — return only these departments.
   * e.g. `?departments=Engineering,Marketing`
   */
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsString({ each: true })
  readonly departments?: string[];

  /**
   * Whether to include the `userAddress` map (names -> postal codes).
   * That data is PII, so it is OPT-IN and defaults to `false`: callers must
   * deliberately ask for it. e.g. `?includeAddresses=true`
   */
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  readonly includeAddresses: boolean = false;
}
