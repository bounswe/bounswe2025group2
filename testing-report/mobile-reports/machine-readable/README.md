# Mobile Frontend Machine-Readable Test Reports

This directory contains machine-readable test reports for the mobile frontend application in XML format.

## Contents

- **mobile-test-report.xml** - JUnit-style XML test report
  - Complete test execution results
  - Individual test case results with timing
  - Failure messages and stack traces
  - Coverage metrics
  - Test environment properties

## Report Format

The XML report follows the JUnit test report format, which is compatible with most CI/CD systems and test reporting tools.

## Structure

```xml
<testsuites>
  <testsuite name="..." tests="..." failures="..." errors="..." time="...">
    <testcase classname="..." name="..." time="...">
      <failure message="..." type="...">...</failure>
    </testcase>
  </testsuite>
  <properties>...</properties>
  <coverage>...</coverage>
  <fileCoverage>...</fileCoverage>
</testsuites>
```

## Usage

This XML report can be:
- Imported into CI/CD systems (Jenkins, GitLab CI, GitHub Actions, etc.)
- Analyzed by test reporting tools
- Parsed programmatically for custom reporting
- Used for trend analysis over time

## Report Information

- **Generated:** December 21, 2025
- **Format:** JUnit XML
- **Total Tests:** 127
- **Test Suites:** 7
- **Execution Time:** 7.418 seconds

## Test Results Summary

- **Passed:** 92 tests (72.4%)
- **Failed:** 35 tests (27.6%)
- **Errors:** 0
- **Skipped:** 0

## Coverage Summary

- **Statements:** 9.25%
- **Branches:** 4.81%
- **Functions:** 3.84%
- **Lines:** 9.68%