export const UserGender = {
  Male: 'male',
  Female: 'female',
} as const;

export type UserGender = (typeof UserGender)[keyof typeof UserGender];

export interface UserHair {
  readonly color: string;
}

export interface UserAddress {
  readonly postalCode: string;
}

export interface UserCompany {
  readonly department: string;
}

export interface DummyJsonUser {
  readonly firstName: string;
  readonly lastName: string;
  readonly age: number;
  readonly gender: UserGender;
  readonly hair: UserHair;
  readonly address: UserAddress;
  readonly company: UserCompany;
}

export interface DummyJsonUsersResponse {
  readonly users: ReadonlyArray<DummyJsonUser>;
  readonly total: number;
}
