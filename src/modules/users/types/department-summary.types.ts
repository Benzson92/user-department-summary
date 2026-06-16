export type HairColorCount = Record<string, number>;

export type UserAddress = Record<string, string>;

export interface DepartmentSummary {
  readonly male: number;
  readonly female: number;
  readonly ageRange: string;
  readonly hair: HairColorCount;
  readonly userAddress: UserAddress;
}

export type DepartmentSummaryReport = Record<string, DepartmentSummary>;

export interface DepartmentSummaryData {
  male: number;
  female: number;
  minAge: number;
  maxAge: number;
  hair: HairColorCount;
  userAddress: UserAddress;
}
