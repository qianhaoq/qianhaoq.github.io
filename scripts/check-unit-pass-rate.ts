import { readFileSync } from 'node:fs';

type AssertionResult = {
  status?: string;
};

type TestResult = {
  assertionResults?: AssertionResult[];
};

type VitestJsonReport = {
  numPassedTests?: number;
  numTotalTests?: number;
  testResults?: TestResult[];
};

const [, , reportPath = '.test-results/unit-results.json', thresholdInput = '90'] = process.argv;
const threshold = Number(thresholdInput);

if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
  throw new Error(`Invalid pass-rate threshold: ${thresholdInput}`);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8')) as VitestJsonReport;
const counted = countTests(report);

if (counted.total === 0) {
  throw new Error('Unit test gate failed: no tests were executed.');
}

const passRate = (counted.passed / counted.total) * 100;
const summary = `Unit test pass rate: ${passRate.toFixed(2)}% (${counted.passed}/${counted.total}); required > ${threshold}%`;

if (passRate <= threshold) {
  throw new Error(`Unit test gate failed. ${summary}`);
}

console.log(summary);

function countTests(report: VitestJsonReport) {
  if (typeof report.numTotalTests === 'number' && typeof report.numPassedTests === 'number') {
    return {
      passed: report.numPassedTests,
      total: report.numTotalTests
    };
  }

  const assertions = report.testResults?.flatMap((result) => result.assertionResults ?? []) ?? [];
  return assertions.reduce(
    (counts, assertion) => {
      counts.total += 1;
      if (assertion.status === 'passed') {
        counts.passed += 1;
      }
      return counts;
    },
    { passed: 0, total: 0 }
  );
}
