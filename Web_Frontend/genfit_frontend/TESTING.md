# Testing Documentation for GenFit Frontend

## Overview

This project uses **Vitest** as the testing framework along with **React Testing Library** for component testing. Vitest is specifically designed for Vite projects and provides excellent performance, native ESM support, and a Jest-compatible API.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm test -- --watch

# Run tests with UI (interactive browser-based test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Why Vitest?

- **Native Vite Integration**: Works seamlessly with your existing Vite configuration
- **Fast**: Utilizes Vite's transformation pipeline for instant HMR-like test execution
- **ESM First**: Native ES modules support without configuration
- **Jest Compatible**: Familiar API if you've used Jest before
- **Better DX**: Built-in TypeScript support, smart watch mode, and great error messages

## Project Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup and configuration
│   ├── test-utils.tsx        # Custom render functions and utilities
│   ├── mocks/
│   │   └── handlers.ts       # Mock API responses and test data
│   └── README.md             # Detailed testing guide
├── components/
│   ├── __tests__/            # Component tests
│   │   └── *.test.tsx
│   └── ui/
│       └── __tests__/        # UI component tests
│           └── *.test.tsx
├── pages/
│   └── */
│       └── __tests__/        # Page component tests
│           └── *.test.tsx
└── lib/
    └── hooks/
        └── __tests__/        # Hook tests
            └── *.test.ts
```

## Configuration Files

### `vite.config.ts`
Contains the Vitest configuration including:
- Test environment (happy-dom)
- Setup files
- Coverage settings
- Global test utilities

### `src/test/setup.ts`
Global test setup that runs before all tests:
- Imports `@testing-library/jest-dom` for additional matchers
- Mocks browser APIs (matchMedia, IntersectionObserver, etc.)
- Sets up cleanup after each test
- Configures environment variables

### `src/test/test-utils.tsx`
Custom utilities for testing:
- `renderWithProviders`: Wraps components with necessary providers (Router, QueryClient)
- `createTestQueryClient`: Creates isolated QueryClient for each test
- Re-exports all React Testing Library utilities

### `src/test/mocks/handlers.ts`
Mock data and API response creators:
- Mock user, goals, challenges, etc.
- Helper functions for creating mock API responses
- Mock fetch implementation for testing

## Writing Tests

### Basic Component Test

```tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
```

### Testing with User Interactions

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../test/test-utils';

describe('MyButton', () => {
  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<MyButton onClick={handleClick}>Click me</MyButton>);

    await user.click(screen.getByRole('button', { name: 'Click me' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Hooks

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('fetches data successfully', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useMyHook(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

### Mocking Modules

```tsx
import { vi } from 'vitest';
import * as libHooks from '../../lib';

// Mock the entire module
vi.mock('../../lib', async () => {
  const actual = await vi.importActual('../../lib');
  return {
    ...actual,
    useIsAuthenticated: vi.fn(),
    useGoals: vi.fn(),
  };
});

describe('MyComponent', () => {
  it('renders when authenticated', () => {
    vi.mocked(libHooks.useIsAuthenticated).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: mockUser,
    });

    // Your test code here
  });
});
```

## Best Practices

### 1. Always Use `renderWithProviders`

```tsx
// ✅ Good
import { renderWithProviders } from '../../test/test-utils';
renderWithProviders(<MyComponent />);

// ❌ Bad
import { render } from '@testing-library/react';
render(<MyComponent />);
```

### 2. Query by Accessibility Role

```tsx
// ✅ Good - Tests accessibility and user experience
screen.getByRole('button', { name: 'Submit' });
screen.getByRole('textbox', { name: 'Email' });

// ⚠️ Less preferred - Fragile to implementation changes
screen.getByTestId('submit-button');
```

### 3. Use `waitFor` for Async Operations

```tsx
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### 4. Clean Up Mocks Between Tests

```tsx
import { vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});
```

### 5. Test User Behavior, Not Implementation

```tsx
// ✅ Good - Tests what the user experiences
it('displays error message when form is invalid', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginForm />);

  await user.click(screen.getByRole('button', { name: 'Login' }));

  expect(screen.getByText('Email is required')).toBeInTheDocument();
});

// ❌ Bad - Tests internal implementation
it('calls validateForm function', () => {
  const validateForm = vi.fn();
  renderWithProviders(<LoginForm validateForm={validateForm} />);
  expect(validateForm).toHaveBeenCalled();
});
```

## Example Tests

Check out these example test files to see testing patterns in action:

- **Component Tests**: `src/components/__tests__/ActivityDashboard.test.tsx`
- **Page Tests**: `src/pages/home/__tests__/HomePage.test.tsx`
- **Hook Tests**: `src/lib/hooks/__tests__/useAuth.test.ts`
- **UI Component Tests**: `src/components/ui/__tests__/button.test.tsx`
- **Utility Tests**: `src/lib/utils/__tests__/index.test.ts`

## Coverage Reports

After running `npm run test:coverage`, you'll find coverage reports in the `coverage/` directory:

- `coverage/index.html` - Interactive HTML report
- `coverage/coverage-final.json` - JSON data for CI/CD integration
- Terminal output with coverage summary

## Debugging Tests

### View Rendered Output

```tsx
import { screen } from '@testing-library/react';

// Print the entire DOM
screen.debug();

// Print a specific element
screen.debug(screen.getByRole('button'));
```

### Use Vitest UI

The Vitest UI provides a browser-based interface for running and debugging tests:

```bash
npm run test:ui
```

Features:
- Visual test runner
- Interactive filtering
- Real-time updates
- Detailed error messages
- Source code navigation

### Check Available Queries

```tsx
import { screen } from '@testing-library/react';

// Suggests better queries for finding elements
screen.logTestingPlaygroundURL();
```

## Common Issues and Solutions

### Issue: Tests timing out

**Solution**: Increase timeout or check for unresolved promises

```tsx
it('loads data', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

### Issue: Can't find element

**Solution**: Use `screen.debug()` to see what's rendered, or wait for async updates

```tsx
await waitFor(() => {
  expect(screen.getByText('Expected text')).toBeInTheDocument();
});
```

### Issue: Mock not working

**Solution**: Ensure mocks are defined before imports and use proper ES module syntax

```tsx
// ✅ Good
vi.mock('../../lib', async () => {
  const actual = await vi.importActual('../../lib');
  return { ...actual, useMyHook: vi.fn() };
});

// ❌ Bad
vi.mock('../../lib', () => ({
  useMyHook: vi.fn(),
}));
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test -- --run
      - run: npm run test:coverage
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Detailed Testing Guide](./src/test/README.md)

## Getting Help

If you encounter issues or have questions:

1. Check the [detailed testing guide](./src/test/README.md)
2. Look at existing test files for examples
3. Consult the official documentation
4. Ask the team for help

Happy testing! 🧪

