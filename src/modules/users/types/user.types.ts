/**
 * The shape of a user record EXACTLY as the upstream provider (dummyjson.com)
 * delivers it. We only declare the fields we actually consume — declaring the
 * whole vendor payload would couple us to data we never touch.
 *
 * Everything is `readonly`: incoming data is raw produce from the supplier and
 * should never be mutated in place. We read it, we transform it, we never edit it.
 */

/**
 * Allowed gender values, declared once as named CONSTANTS so call sites read
 * `UserGender.Male` instead of the magic string `'male'`.
 *
 * The pattern is a "companion object": a `const` value and a `type` that share
 * the name `UserGender`. The type is DERIVED from the constant via
 * `(typeof ...)[keyof typeof ...]`, so adding a value to the object
 * automatically widens the type — the values and the type can never drift apart.
 *
 * We prefer this over a TS `enum` because the values stay plain strings (they
 * match the API verbatim, serialise cleanly, and have no hidden runtime object
 * with reverse mappings).
 */
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

/**
 * The envelope the API wraps the list in: `{ users: [...], total, skip, limit }`.
 * We only care about `users`, so that is all we model.
 */
export interface DummyJsonUsersResponse {
  readonly users: ReadonlyArray<DummyJsonUser>;
  readonly total: number;
}
