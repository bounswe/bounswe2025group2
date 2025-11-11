# Testing Guide for GenFit Frontend

This guide explains how to write and run tests for the GenFit frontend application.

## Overview

We use **Vitest** as our testing framework along with **React Testing Library** for component testing. Vitest is specifically designed for Vite projects and offers excellent performance and developer experience.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm test -- --watch

# Run tests with UI
npm test:ui

# Run tests with coverage report
npm test:coverage
```

## Project Structure

```
src/
├── test/
│   ├── setup.ts              # Global test setup
│   ├── test-utils.tsx        # Custom render functions and utilities
│   ├── mocks/
│   │   └── handlers.ts       # Mock API responses and data
│   └── README.md             # This file
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

### Testing User Interactions

```tsx
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../test/test-utils';
import MyButton from '../MyButton';

describe('MyButton', () => {
  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<MyButton onClick={handleClick}>Click me</MyButton>);

    const button = screen.getByRole('button', { name: 'Click me' });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Hooks

```tsx
import { describe, it, expect, vi } from 'vitest';
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

    expect(result.current.data).toBeDefined();
  });
});
```

### Mocking API Calls

```tsx
import { vi, beforeEach } from 'vitest';
import { GFapi } from '../lib/api/GFapi';

// Mock the entire module
vi.mock('../lib/api/GFapi', () => ({
  GFapi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches data on mount', async () => {
    vi.mocked(GFapi.get).mockResolvedValue({ data: 'test' });

    // Your test code here
  });
});
```

### Mocking Custom Hooks

```tsx
import { vi } from 'vitest';

// Mock the entire module
vi.mock('../../lib', () => ({
  useIsAuthenticated: vi.fn(),
  useGoals: vi.fn(),
}));

describe('MyComponent', () => {
  it('renders when authenticated', () => {
    const lib = require('../../lib');
    vi.mocked(lib.useIsAuthenticated).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: mockUser,
    });

    // Your test code here
  });
});
```

## Best Practices

### 1. Use `renderWithProviders` for Components

Always use the custom `renderWithProviders` function instead of the default `render` from React Testing Library. This ensures your components have access to necessary providers (Router, QueryClient, etc.).

```tsx
// ✅ Good
import { renderWithProviders } from '../../test/test-utils';
renderWithProviders(<MyComponent />);

// ❌ Bad
import { render } from '@testing-library/react';
render(<MyComponent />);
```

### 2. Query by Role When Possible

Prefer querying elements by their accessibility role rather than by test IDs or text content.

```tsx
// ✅ Good
screen.getByRole('button', { name: 'Submit' });
screen.getByRole('textbox', { name: 'Email' });

// ⚠️ Less preferred
screen.getByTestId('submit-button');
screen.getByText('Submit');
```

### 3. Use `waitFor` for Async Operations

When testing asynchronous behavior, always use `waitFor` to ensure the DOM has updated.

```tsx
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### 4. Clean Up Mocks

Always clear mocks between tests to avoid test pollution.

```tsx
import { vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});
```

### 5. Test User Behavior, Not Implementation

Focus on testing what the user sees and does, not internal implementation details.

```tsx
// ✅ Good - Tests user behavior
it('displays error message when form is invalid', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginForm />);

  await user.click(screen.getByRole('button', { name: 'Login' }));

  expect(screen.getByText('Email is required')).toBeInTheDocument();
});

// ❌ Bad - Tests implementation details
it('calls validateForm function', () => {
  const validateForm = vi.fn();
  renderWithProviders(<LoginForm validateForm={validateForm} />);
  expect(validateForm).toHaveBeenCalled();
});
```

### 6. Use Descriptive Test Names

Write test names that clearly describe what is being tested.

```tsx
// ✅ Good
it('displays error message when login fails');
it('redirects to dashboard after successful login');
it('disables submit button while loading');

// ❌ Bad
it('works correctly');
it('test login');
it('should work');
```

## Common Testing Patterns

### Testing Forms

```tsx
it('submits form with valid data', async () => {
  const handleSubmit = vi.fn();
  const user = userEvent.setup();

  renderWithProviders(<MyForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'password123');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  });
});
```

### Testing Navigation

```tsx
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

it('navigates to profile page when button is clicked', async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyComponent />);

  await user.click(screen.getByRole('button', { name: 'View Profile' }));

  expect(mockNavigate).toHaveBeenCalledWith('/profile');
});
```

### Testing Loading States

```tsx
it('shows loading spinner while fetching data', () => {
  vi.mocked(useData).mockReturnValue({
    data: undefined,
    isLoading: true,
    error: null,
  });

  renderWithProviders(<MyComponent />);

  expect(screen.getByText('Loading...')).toBeInTheDocument();
});
```

### Testing Error States

```tsx
it('displays error message when fetch fails', () => {
  vi.mocked(useData).mockReturnValue({
    data: undefined,
    isLoading: false,
    error: new Error('Failed to fetch'),
  });

  renderWithProviders(<MyComponent />);

  expect(screen.getByText('Failed to load data')).toBeInTheDocument();
});
```

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

Run tests with the UI for better debugging experience:

```bash
npm run test:ui
```

### Check Available Queries

```tsx
import { screen } from '@testing-library/react';

// Log all available queries
screen.logTestingPlaygroundURL();
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

If you encounter issues or have questions about testing:

1. Check this README first
2. Look at existing test files for examples
3. Consult the official documentation
4. Ask the team for help

Happy testing! 🧪

