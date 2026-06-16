import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

import { toBoolean, toStringArray } from '@/utils/query-param-parser';

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
