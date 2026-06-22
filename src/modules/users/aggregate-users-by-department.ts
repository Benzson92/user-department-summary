import { UserGender, type DummyJsonUser } from './types/user.types';
import type {
  DepartmentSummary,
  DepartmentSummaryData,
  DepartmentSummaryReport,
} from './types/department-summary.types';

const createEmptyDepartmentSummaryData = (): DepartmentSummaryData => ({
  male: 0,
  female: 0,
  minAge: Number.POSITIVE_INFINITY,
  maxAge: Number.NEGATIVE_INFINITY,
  hair: {},
  userAddress: {},
});

const updateDepartmentSummaryData = ({
  summaryData,
  user,
}: {
  summaryData: DepartmentSummaryData;
  user: DummyJsonUser;
}): void => {
  if (user.gender === UserGender.Male) {
    summaryData.male += 1;
  } else if (user.gender === UserGender.Female) {
    summaryData.female += 1;
  }

  if (user.age < summaryData.minAge) {
    summaryData.minAge = user.age;
  }
  if (user.age > summaryData.maxAge) {
    summaryData.maxAge = user.age;
  }

  const hairColor = user.hair.color;
  summaryData.hair[hairColor] = (summaryData.hair[hairColor] ?? 0) + 1;

  const fullName = `${user.firstName}${user.lastName}`;
  summaryData.userAddress[fullName] = user.address.postalCode;
};

const buildDepartmentSummary = (
  summaryData: DepartmentSummaryData,
): DepartmentSummary => ({
  male: summaryData.male,
  female: summaryData.female,
  ageRange: `${summaryData.minAge}-${summaryData.maxAge}`,
  hair: summaryData.hair,
  userAddress: summaryData.userAddress,
});

export const aggregateUsersByDepartment = (
  users: ReadonlyArray<DummyJsonUser>,
): DepartmentSummaryReport => {
  const summaryDataByDepartment = new Map<string, DepartmentSummaryData>();

  for (const user of users) {
    const departmentName = user.company.department;

    let summaryData = summaryDataByDepartment.get(departmentName);
    if (summaryData === undefined) {
      summaryData = createEmptyDepartmentSummaryData();
      summaryDataByDepartment.set(departmentName, summaryData);
    }

    updateDepartmentSummaryData({ summaryData, user });
  }

  const report: DepartmentSummaryReport = {};
  for (const [departmentName, summaryData] of summaryDataByDepartment) {
    report[departmentName] = buildDepartmentSummary(summaryData);
  }

  return report;
};
