# Testing Guide - Digital Dash Web Application

## Overview

This project now includes a comprehensive testing suite using:

- **Playwright** for end-to-end (E2E) testing
- **Vitest** for unit testing (already configured)

## Quick Start

### Install Dependencies

```bash
yarn install
```

### Run Tests

```bash
# Run all tests (unit + E2E)
yarn test

# Run only E2E tests
yarn test:e2e

# Run only unit tests
yarn test:unit:run

# Run E2E tests with UI (recommended for development)
yarn test:e2e:ui

# Debug E2E tests
yarn test:e2e:debug

# Run E2E tests with visible browser
yarn test:e2e:headed

# View test report
yarn test:e2e:report
```

## Test Suite Summary

### Current Test Coverage

We have **100+ test cases** covering:

#### 1. **Home Page Tests** (`tests/e2e/home.spec.ts`)

- 17 tests covering:
  - Page loading and rendering
  - Dashboard and view cards
  - Alerts and dynamic rules summaries
  - Navigation links
  - Hover effects
  - Responsive design
  - Active/inactive states

#### 2. **Settings Page Tests** (`tests/e2e/settings.spec.ts`)

- 14 tests covering:
  - Page display and structure
  - Firmware version display
  - Splash screen duration configuration
  - Configuration backup/export
  - Configuration import
  - Form validation
  - Settings availability warnings
  - Responsive layout
  - Button states and styling

#### 3. **Navigation Tests** (`tests/e2e/navigation.spec.ts`)

- 6 tests covering:
  - Route navigation across all pages
  - Browser back/forward buttons
  - State preservation
  - Page load performance
  - Error handling

#### 4. **Alerts Page Tests** (`tests/e2e/alerts.spec.ts`)

- 4 tests covering:
  - Page display
  - Navigation from home
  - Error-free rendering
  - JavaScript error detection

#### 5. **Accessibility Tests** (`tests/e2e/accessibility.spec.ts`)

- 50+ tests covering:
  - Page titles for all routes
  - Keyboard navigation
  - Console error checking
  - Image loading
  - Dark mode support
  - Semantic HTML structure
  - Responsive design (desktop, tablet, mobile)
  - Interactive elements

## Test Organization

```
tests/
├── e2e/                      # End-to-end tests
│   ├── accessibility.spec.ts # Accessibility & responsive tests
│   ├── alerts.spec.ts        # Alerts page tests
│   ├── home.spec.ts          # Home page tests
│   ├── navigation.spec.ts    # Navigation tests
│   └── settings.spec.ts      # Settings page tests
├── fixtures/                 # Test data and fixtures
│   └── test-fixtures.ts      # Mock data for testing
├── utils/                    # Test utilities
│   └── test-helpers.ts       # Reusable helper functions
├── example.spec.ts           # Template for new tests
└── README.md                 # Detailed testing documentation
```

## Key Features

### Test Helpers

The `test-helpers.ts` provides utilities for common tasks:

```typescript
import { navigateToRoute, waitForPageReady, expectVisible } from './utils/test-helpers';

// Navigate and wait for page ready
await navigateToRoute(page, '/settings');

// Wait for all network requests to complete
await waitForPageReady(page);

// Check element visibility
await expectVisible(page, '.my-element');

// Work with localStorage
await setLocalStorage(page, 'key', 'value');
const value = await getLocalStorage(page, 'key');
```

### Test Fixtures

Mock data is available through fixtures:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test('uses mock data', async ({ page, mockData }) => {
	// Access mock configuration
	console.log(mockData.general);
	console.log(mockData.alerts);
});
```

### Example Template

Use `tests/example.spec.ts` as a template for creating new tests. It includes examples of:

- Basic page navigation
- Element interaction
- Form filling
- Screenshot capture
- Responsive testing
- localStorage manipulation
- Test skipping and tags

## CI/CD Integration

### GitHub Actions Workflows

#### 1. `test.yml` - Full Test Suite

Runs on push/PR to main/master/develop:

- Unit tests
- E2E tests
- Linting
- Type checking

#### 2. `playwright.yml` - Playwright Tests Only

Focused workflow for E2E tests with detailed reporting.

### Artifacts

Test reports and results are uploaded as artifacts and retained for 30 days.

## Configuration

### Playwright Config (`playwright.config.ts`)

- **Test Directory**: `./tests`
- **Base URL**: `http://localhost:4173`
- **Browser**: Chromium (Firefox and WebKit available)
- **Retries**: 2 on CI, 0 locally
- **Trace**: On first retry
- **Screenshots**: Only on failure
- **Video**: Retained on failure
- **Parallel**: Full parallelization enabled

### Vitest Config (`vite.config.ts`)

- **Test Files**: `src/**/*.{test,spec}.{js,ts}`
- Already configured for unit testing

## Writing New Tests

### 1. Create a new test file

```typescript
import { test, expect } from '@playwright/test';
import { navigateToRoute } from '../utils/test-helpers';

test.describe('My Feature', () => {
	test.beforeEach(async ({ page }) => {
		await navigateToRoute(page, '/my-route');
	});

	test('should do something', async ({ page }) => {
		await expect(page.locator('.element')).toBeVisible();
	});
});
```

### 2. Run your test

```bash
# Run specific test file
npx playwright test my-test.spec.ts

# Run in UI mode for development
yarn test:e2e:ui
```

### 3. Debug if needed

```bash
# Debug mode with inspector
yarn test:e2e:debug

# See browser while testing
yarn test:e2e:headed
```

## Best Practices

1. **Use descriptive test names** - Clearly state what is being tested
2. **One assertion per test** - Keep tests focused
3. **Use test helpers** - Reuse common functionality
4. **Wait properly** - Use `waitForPageReady()` instead of arbitrary timeouts
5. **Test user behavior** - Focus on what users see and do
6. **Keep tests independent** - Each test should run in isolation
7. **Clean up** - Use `afterEach` to reset state if needed
8. **Test responsively** - Check mobile, tablet, and desktop views

## Debugging

### Visual Debugging (Recommended)

```bash
yarn test:e2e:ui
```

Opens an interactive UI to run, debug, and inspect tests.

### Step-by-Step Debugging

```bash
yarn test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### View Test Report

```bash
yarn test:e2e:report
```

Opens HTML report of last test run.

### Trace Viewer

After a failed test:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## Common Issues

### Port 4173 Already in Use

Either stop the process using that port or change it in `playwright.config.ts`.

### Tests Timing Out

- Ensure dev server is running
- Check network conditions
- Increase timeout if needed

### Browser Not Found

```bash
npx playwright install chromium
```

## Running Tests in Different Environments

### Local Development

```bash
yarn test:e2e:ui  # Interactive, best for development
```

### CI/CD

```bash
yarn test  # Runs all tests once
```

### Pre-commit

```bash
yarn test:unit:run  # Quick unit tests before committing
```

## Test Statistics

- **Total E2E Tests**: 100+
- **Test Files**: 5 (+ 1 example template)
- **Routes Covered**: 6+ (Home, Settings, Alerts, Dynamic, Backgrounds, Advanced)
- **Helper Functions**: 12+
- **Mock Fixtures**: Available
- **CI Integration**: GitHub Actions
- **Browsers**: Chromium (Firefox, WebKit available)

## Next Steps

1. **Run the tests**: `yarn test:e2e:ui`
2. **Review test coverage**: Check which areas need more tests
3. **Add new tests**: Use `tests/example.spec.ts` as a template
4. **Integrate with CI**: Tests will run automatically on push/PR
5. **Monitor reports**: Check GitHub Actions artifacts for test reports

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Test README](./tests/README.md) - Detailed testing documentation
- [Example Tests](./tests/example.spec.ts) - Test template and examples

## Maintenance

### Updating Dependencies

```bash
# Update Playwright
yarn add -D @playwright/test@latest

# Install new browser versions
npx playwright install chromium
```

### Adding New Routes

When adding new routes, create corresponding test files in `tests/e2e/` and add route tests to `navigation.spec.ts` and `accessibility.spec.ts`.

### Test Coverage Goals

- Aim for >80% route coverage
- All critical user flows should have E2E tests
- Complex components should have unit tests
- Accessibility tests for all public pages

---

**Happy Testing!** 🎭✨

For questions or issues, refer to the [tests/README.md](./tests/README.md) or create an issue in the repository.
