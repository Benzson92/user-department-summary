import { describe, expect, it } from 'vitest';

import { aggregateUsersByDepartment } from '@/modules/users/aggregate-users-by-department';

import { UserGender, type DummyJsonUser } from '@/modules/users/types/user.types';
import type {
  DepartmentSummary,
  DepartmentSummaryReport,
} from '@/modules/users/types/department-summary.types';

interface CreateTestUserOverrides {
  age?: number;
  department?: string;
  firstName?: string;
  gender?: DummyJsonUser['gender'];
  hairColor?: string;
  lastName?: string;
  postalCode?: string;
}

function assertDefined<T>(
  value: T,
  message?: string,
): asserts value is NonNullable<T> {
  expect(value, message).toBeDefined();
}

const getDepartmentSummary = (
  departmentSummaryReport: DepartmentSummaryReport,
  departmentName: string,
): DepartmentSummary => {
  const departmentSummary =
    departmentSummaryReport[departmentName];

  assertDefined(
    departmentSummary,
    `expected a "${departmentName}" summary`,
  );

  return departmentSummary;
};

const createTestUser = (
  overrides: CreateTestUserOverrides = {},
): DummyJsonUser => {
  const {
    age = 30,
    department = 'Engineering',
    firstName = 'Somchai',
    gender = UserGender.Male,
    hairColor = 'Black',
    lastName = 'Jaidee',
    postalCode = '10110',
  } = overrides;

  return {
    firstName,
    lastName,
    age,
    gender,
    hair: { color: hairColor },
    address: { postalCode },
    company: { department },
  } as DummyJsonUser;
};

describe('aggregateUsersByDepartment', () => {
  describe('basic shape', () => {
    it('returns an empty report for an empty user list', () => {
      const report = aggregateUsersByDepartment([]);

      expect(report).toEqual({});
    });

    it('builds a complete summary for a single user', () => {
      const users = [
        createTestUser({
          age: 28,
          department: 'Engineering',
          firstName: 'Somchai',
          gender: UserGender.Male,
          hairColor: 'Black',
          lastName: 'Jaidee',
          postalCode: '10110',
        }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(report).toEqual({
        Engineering: {
          male: 1,
          female: 0,
          ageRange: '28-28',
          hair: { Black: 1 },
          userAddress: { SomchaiJaidee: '10110' },
        },
      });
    });

    it('creates one summary entry per distinct department', () => {
      const users = [
        createTestUser({ department: 'Engineering' }),
        createTestUser({ department: 'Marketing' }),
        createTestUser({ department: 'Engineering' }),
        createTestUser({ department: 'Support' }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(Object.keys(report).sort()).toEqual([
        'Engineering',
        'Marketing',
        'Support',
      ]);
    });
  });

  describe('gender tally', () => {
    it('counts male and female users independently', () => {
      const users = [
        createTestUser({ gender: UserGender.Male }),
        createTestUser({ gender: UserGender.Male }),
        createTestUser({ gender: UserGender.Female }),
      ];

      const report = aggregateUsersByDepartment(users);
      const engineering = getDepartmentSummary(report, 'Engineering');

      expect(engineering.male).toBe(2);
      expect(engineering.female).toBe(1);
    });

    it('ignores unexpected gender values without crashing or polluting counts', () => {
      const users = [
        createTestUser({ gender: UserGender.Female }),
        createTestUser({ gender: 'other' as DummyJsonUser['gender'] }),
      ];

      const report = aggregateUsersByDepartment(users);
      const engineering = getDepartmentSummary(report, 'Engineering');

      expect(engineering.male).toBe(0);
      expect(engineering.female).toBe(1);
    });

    it('still aggregates non-gender fields for users with unexpected gender values', () => {
      const users = [
        createTestUser({
          age: 45,
          gender: 'other' as DummyJsonUser['gender'],
          hairColor: 'Auburn',
        }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(getDepartmentSummary(report, 'Engineering')).toEqual(
        expect.objectContaining({
          male: 0,
          female: 0,
          ageRange: '45-45',
          hair: { Auburn: 1 },
        }),
      );
    });
  });

  describe('age range', () => {
    it('formats a single age as "age-age" when min equals max', () => {
      const users = [createTestUser({ age: 33 })];

      const report = aggregateUsersByDepartment(users);

      expect(getDepartmentSummary(report, 'Engineering').ageRange).toBe('33-33');
    });

    it('tracks the min and max age regardless of input order', () => {
      const users = [
        createTestUser({ age: 41 }),
        createTestUser({ age: 19 }),
        createTestUser({ age: 64 }),
        createTestUser({ age: 30 }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(getDepartmentSummary(report, 'Engineering').ageRange).toBe('19-64');
    });

    it('tracks age extremes per department, not globally', () => {
      const users = [
        createTestUser({ age: 22, department: 'Engineering' }),
        createTestUser({ age: 58, department: 'Engineering' }),
        createTestUser({ age: 35, department: 'Marketing' }),
        createTestUser({ age: 40, department: 'Marketing' }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(getDepartmentSummary(report, 'Engineering').ageRange).toBe('22-58');
      expect(getDepartmentSummary(report, 'Marketing').ageRange).toBe('35-40');
    });
  });

  describe('hair colour tally', () => {
    it('starts a new colour at 1 and increments repeats', () => {
      const users = [
        createTestUser({ hairColor: 'Black' }),
        createTestUser({ hairColor: 'Black' }),
        createTestUser({ hairColor: 'Blond' }),
        createTestUser({ hairColor: 'Black' }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(getDepartmentSummary(report, 'Engineering').hair).toEqual({
        Black: 3,
        Blond: 1,
      });
    });

    it('tallies hair colours per department independently', () => {
      const users = [
        createTestUser({ department: 'Engineering', hairColor: 'Brown' }),
        createTestUser({ department: 'Marketing', hairColor: 'Brown' }),
        createTestUser({ department: 'Marketing', hairColor: 'Brown' }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(getDepartmentSummary(report, 'Engineering').hair).toEqual({ Brown: 1 });
      expect(getDepartmentSummary(report, 'Marketing').hair).toEqual({ Brown: 2 });
    });
  });

  describe('user address book', () => {
    it('maps "FirstNameLastName" (no separator) to the postal code', () => {
      const users = [
        createTestUser({
          firstName: 'Malee',
          lastName: 'Suksai',
          postalCode: '50000',
        }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(getDepartmentSummary(report, 'Engineering').userAddress).toEqual({
        MaleeSuksai: '50000',
      });
    });

    it('collects one entry per distinct full name', () => {
      const users = [
        createTestUser({ firstName: 'Anan', lastName: 'Thong', postalCode: '10200' }),
        createTestUser({ firstName: 'Nok', lastName: 'Wong', postalCode: '10300' }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(getDepartmentSummary(report, 'Engineering').userAddress).toEqual({
        AnanThong: '10200',
        NokWong: '10300',
      });
    });

    it('lets the LAST user win when two users share a full name (documented collision behaviour)', () => {
      const users = [
        createTestUser({ firstName: 'Anan', lastName: 'Thong', postalCode: '10200' }),
        createTestUser({ firstName: 'Anan', lastName: 'Thong', postalCode: '99999' }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(getDepartmentSummary(report, 'Engineering').userAddress).toEqual({
        AnanThong: '99999',
      });
    });
  });

  describe('department isolation', () => {
    it('does not bleed any counters between departments', () => {
      const users = [
        createTestUser({
          age: 25,
          department: 'Engineering',
          firstName: 'Eng',
          gender: UserGender.Male,
          hairColor: 'Black',
          lastName: 'One',
          postalCode: '10110',
        }),
        createTestUser({
          age: 52,
          department: 'Marketing',
          firstName: 'Mkt',
          gender: UserGender.Female,
          hairColor: 'Blond',
          lastName: 'Two',
          postalCode: '20150',
        }),
      ];

      const report = aggregateUsersByDepartment(users);

      expect(report).toEqual({
        Engineering: {
          male: 1,
          female: 0,
          ageRange: '25-25',
          hair: { Black: 1 },
          userAddress: { EngOne: '10110' },
        },
        Marketing: {
          male: 0,
          female: 1,
          ageRange: '52-52',
          hair: { Blond: 1 },
          userAddress: { MktTwo: '20150' },
        },
      });
    });
  });

  describe('purity', () => {
    it('does not mutate the input users array', () => {
      const users = [
        createTestUser({ department: 'Engineering' }),
        createTestUser({ department: 'Marketing', gender: UserGender.Female }),
      ];
      const snapshot = structuredClone(users);

      aggregateUsersByDepartment(users);

      expect(users).toEqual(snapshot);
    });

    it('produces identical reports for identical inputs (deterministic)', () => {
      const users = [
        createTestUser({ age: 20 }),
        createTestUser({ age: 40, gender: UserGender.Female }),
      ];

      const first = aggregateUsersByDepartment(users);
      const second = aggregateUsersByDepartment(users);

      expect(first).toEqual(second);
    });
  });
});