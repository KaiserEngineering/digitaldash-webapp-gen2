# Test Suite Documentation

This directory contains the comprehensive test suite for the Digital Dash web application using Playwright for end-to-end testing.

## Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── home.spec.ts        # Home page tests
│   ├── settings.spec.ts    # Settings page tests
│   ├── alerts.spec.ts      # Alerts page tests
│   ├── navigation.spec.ts  # Navigation and routing tests
│   └── accessibility.spec.ts # Accessibility tests
├── fixtures/               # Test fixtures and mock data
│   └── test-fixtures.ts    # Shared fixtures
├── utils/                  # Test utilities and helpers
│   └── test-helpers.ts     # Reusable test functions
└── README.md              # This file
```

## Running Tests

### E2E Tests (Playwright)

```bash
# Run all E2E tests
yarn test:e2e

# Run tests in UI mode (interactive)
yarn test:e2e:ui

# Run tests in debug mode
yarn test:e2e:debug

# Run tests in headed mode (see the browser)
yarn test:e2e:headed

# View test report
yarn test:e2e:report
```

### Unit Tests (Vitest)

```bash
# Run unit tests in watch mode
yarn test:unit

# Run unit tests once
yarn test:unit:run
```

### Run All Tests

```bash
# Run both unit and E2E tests
yarn test
# or
yarn test:all
```

## Test Categories

### Home Page Tests (`home.spec.ts`)
- Dashboard loading and display
- View cards rendering
- System overview (alerts and dynamic rules)
- Navigation to alerts and dynamic pages
- Summary displays (active alerts/rules counts)
- Responsive layout

### Settings Page Tests (`settings.spec.ts`)
- Settings page display and structure
- Firmware version field
- Splash screen duration input
- Configuration backup/restore functionality
- Save button functionality
- Settings availability warnings
- Responsive design

### Navigation Tests (`navigation.spec.ts`)
- Route navigation
- Browser back/forward buttons
- State preservation
- Page load performance
- Error handling

### Accessibility Tests (`accessibility.spec.ts`)
- Page titles
- Keyboard navigation
- Console error checking
- Image loading
- Dark mode support
- Semantic HTML
- Responsive design across viewports

### Alerts Page Tests (`alerts.spec.ts`)
- Page loading
- Navigation from home
- Error-free rendering

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { navigateToRoute, waitForPageReady } from '../utils/test-helpers';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToRoute(page, '/route');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Using Test Helpers

The `test-helpers.ts` file provides useful utilities:

- `navigateToRoute(page, route)` - Navigate to a route and wait for it to load
- `waitForPageReady(page)` - Wait for page to fully load
- `expectVisible(page, selector)` - Check if element is visible
- `expectText(page, selector, text)` - Check element text content
- `clickAndWait(page, selector)` - Click and wait for navigation
- `fillInput(page, selector, value)` - Fill an input field
- `getLocalStorage(page, key)` - Get localStorage value
- `setLocalStorage(page, key, value)` - Set localStorage value

### Using Fixtures

Import custom fixtures for mock data:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test('should use mock data', async ({ page, mockData }) => {
  // mockData contains predefined test data
  console.log(mockData.general);
});
```

## Configuration

The Playwright configuration is in `playwright.config.ts` at the project root. Key settings:

- **Base URL**: `http://localhost:4173` (preview server)
- **Browsers**: Chromium (default), Firefox and WebKit available
- **Retries**: 2 on CI, 0 locally
- **Trace**: Captured on first retry
- **Screenshots**: Only on failure
- **Video**: Retained on failure

## CI/CD Integration

Tests run automatically on GitHub Actions:

### Workflows

1. **`playwright.yml`** - Runs Playwright E2E tests
2. **`test.yml`** - Runs full test suite (unit + E2E + lint)

### Artifacts

Test results and reports are uploaded as artifacts and retained for 30 days.

## Best Practices

1. **Isolation**: Each test should be independent
2. **Waiting**: Use proper wait strategies (avoid hardcoded timeouts)
3. **Selectors**: Prefer user-facing attributes (text, labels) over implementation details
4. **Cleanup**: Tests should clean up after themselves
5. **Descriptive Names**: Test names should clearly describe what they verify
6. **Arrange-Act-Assert**: Follow the AAA pattern
7. **Don't Over-Mock**: Test against real data when possible

## Debugging Tips

### Visual Debugging
```bash
yarn test:e2e:ui
```

### Step-by-Step Debugging
```bash
yarn test:e2e:debug
```

### See Browser Actions
```bash
yarn test:e2e:headed
```

### Trace Viewer
After a test run, view traces:
```bash
npx playwright show-trace test-results/path-to-trace.zip
```

## Common Issues

### Port Already in Use
If port 4173 is in use, either:
- Stop the process using that port
- Change the port in `playwright.config.ts`

### Browser Not Installed
Run: `npx playwright install chromium`

### Tests Timing Out
- Check if the dev server is running
- Increase timeout in test configuration
- Check network conditions

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Vitest Documentation](https://vitest.dev)
- [SvelteKit Testing](https://kit.svelte.dev/docs/testing)
