// --- Domain types & constants ---
import { UserGender, type DummyJsonUser } from './types/user.types';
import type {
  DepartmentSummary,
  DepartmentSummaryData,
  DepartmentSummaryReport,
} from './types/department-summary.types';

/**
 * Build fresh, empty summary data for a department we are seeing for the
 * first time.
 *
 * `minAge` starts at +Infinity and `maxAge` at -Infinity so that the FIRST
 * real age we compare against is guaranteed to win both comparisons. This is a
 * classic trick that lets us avoid a special "is this the first user?" branch.
 */
const createEmptyDepartmentSummaryData = (): DepartmentSummaryData => ({
  male: 0,
  female: 0,
  minAge: Number.POSITIVE_INFINITY,
  maxAge: Number.NEGATIVE_INFINITY,
  hair: {},
  userAddress: {},
});

/**
 * Fold a single user into its department's summary data. One user touched, one
 * set of fields updated — no re-scanning, no temporary arrays.
 *
 * Takes an options object so the call site reads self-documentingly
 * (`{ summaryData, user }`) and is easy to extend later.
 */
const updateDepartmentSummaryData = ({
  summaryData,
  user,
}: {
  summaryData: DepartmentSummaryData;
  user: DummyJsonUser;
}): void => {
  // 1. Gender tally — guard the union so unexpected values are simply ignored
  //    rather than crashing or polluting the counts.
  if (user.gender === UserGender.Male) {
    summaryData.male += 1;
  } else if (user.gender === UserGender.Female) {
    summaryData.female += 1;
  }

  // 2. Age range — track the extremes inline. This is O(1) per user, whereas
  //    sorting ages to find min/max would cost O(n log n) per department.
  if (user.age < summaryData.minAge) {
    summaryData.minAge = user.age;
  }
  if (user.age > summaryData.maxAge) {
    summaryData.maxAge = user.age;
  }

  // 3. Hair colour tally — `?? 0` handles the "first time we see this colour".
  const hairColor = user.hair.color;
  summaryData.hair[hairColor] = (summaryData.hair[hairColor] ?? 0) + 1;

  // 4. Address book — "FirstNameLastName" mapped to postal code.
  const fullName = `${user.firstName}${user.lastName}`;
  summaryData.userAddress[fullName] = user.address.postalCode;
};

/**
 * Build the immutable, public-facing summary from the mutable working data.
 * The only real work is formatting the numeric extremes into "min-max".
 */
const buildDepartmentSummary = (
  summaryData: DepartmentSummaryData,
): DepartmentSummary => ({
  male: summaryData.male,
  female: summaryData.female,
  ageRange: `${summaryData.minAge}-${summaryData.maxAge}`,
  hair: summaryData.hair,
  userAddress: summaryData.userAddress,
});

/**
 * Group a flat list of users into a per-department summary report.
 *
 * PERFORMANCE CONTRACT — O(n) time, O(n) space:
 *   - We walk the list exactly ONCE.
 *   - Summary data lives in a `Map`, giving O(1) average lookup/insert.
 *   - Age extremes are tracked during the walk, so there is NO sort anywhere.
 *   - We allocate one summary-data object per department and reuse it.
 *
 * The function is PURE: no I/O, no shared state, no mutation of its input.
 * That purity is what makes it trivially unit-testable and safe to reuse
 * anywhere — a CLI, a worker, a serverless function, or this NestJS service.
 */
export const aggregateUsersByDepartment = (
  users: ReadonlyArray<DummyJsonUser>,
): DepartmentSummaryReport => {
  const summaryDataByDepartment = new Map<string, DepartmentSummaryData>();

  // --- Single pass: accumulate every user into its department's summary data ---
  for (const user of users) {
    const department = user.company.department;

    let summaryData = summaryDataByDepartment.get(department);
    if (summaryData === undefined) {
      summaryData = createEmptyDepartmentSummaryData();
      summaryDataByDepartment.set(department, summaryData);
    }

    updateDepartmentSummaryData({ summaryData, user });
  }

  // --- Build: format each department's summary data into its public summary ---
  const report: DepartmentSummaryReport = {};
  for (const [department, summaryData] of summaryDataByDepartment) {
    report[department] = buildDepartmentSummary(summaryData);
  }

  return report;
};
