# Testing Quick Start Guide

## ✅ Setup Complete!

Your frontend now has a complete unit testing setup with Vitest and React Testing Library.

## 🚀 Quick Commands

```bash
# Run all tests once
npm test -- --run

# Run tests in watch mode (recommended for development)
npm test

# Run tests with interactive UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## 📁 What Was Set Up

### Dependencies Installed
- ✅ `vitest` - Fast test runner for Vite projects
- ✅ `@vitest/ui` - Interactive browser-based test UI
- ✅ `@testing-library/react` - React component testing utilities
- ✅ `@testing-library/jest-dom` - Custom matchers for DOM assertions
- ✅ `@testing-library/user-event` - User interaction simulation
- ✅ `happy-dom` - Fast DOM implementation for tests

### Configuration Files
- ✅ `vite.config.ts` - Updated with Vitest configuration
- ✅ `vitest.config.ts` - Dedicated Vitest config (alternative)
- ✅ `tsconfig.app.json` - Added Vitest types
- ✅ `package.json` - Added test scripts

### Test Infrastructure
- ✅ `src/test/setup.ts` - Global test setup
- ✅ `src/test/test-utils.tsx` - Custom render utilities
- ✅ `src/test/mocks/handlers.ts` - Mock data and API handlers
- ✅ `src/test/README.md` - Detailed testing guide

### Example Tests
- ✅ `src/components/__tests__/ActivityDashboard.test.tsx`
- ✅ `src/components/ui/__tests__/button.test.tsx`
- ✅ `src/lib/hooks/__tests__/useAuth.test.ts`
- ✅ `src/lib/utils/__tests__/index.test.ts`
- ✅ `src/pages/home/__tests__/HomePage.test.tsx`

## 📝 Writing Your First Test

### 1. Create a test file next to your component

```
src/
  components/
    MyComponent.tsx
    __tests__/
      MyComponent.test.tsx  ← Create this
```

### 2. Write a simple test

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

### 3. Run your test

```bash
npm test
```

## 🎯 Common Testing Patterns

### Testing User Interactions

```tsx
import { userEvent } from '../../test/test-utils';

it('handles button click', async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyButton />);
  
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(screen.getByText('Success!')).toBeInTheDocument();
});
```

### Testing Forms

```tsx
it('submits form with user input', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();
  
  renderWithProviders(<MyForm onSubmit={handleSubmit} />);
  
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  
  expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

### Testing Async Operations

```tsx
import { waitFor } from '@testing-library/react';

it('loads data asynchronously', async () => {
  renderWithProviders(<MyComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Mocking API Calls

```tsx
import { vi } from 'vitest';
import { GFapi } from '../lib/api/GFapi';

vi.mock('../lib/api/GFapi', () => ({
  GFapi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

it('fetches data on mount', async () => {
  vi.mocked(GFapi.get).mockResolvedValue({ data: 'test' });
  
  renderWithProviders(<MyComponent />);
  
  await waitFor(() => {
    expect(GFapi.get).toHaveBeenCalledWith('/api/data/');
  });
});
```

## 🔍 Debugging Tests

### View what's rendered

```tsx
import { screen } from '@testing-library/react';

// Print entire DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));
```

### Use Vitest UI for visual debugging

```bash
npm run test:ui
```

This opens a browser with:
- ✅ Visual test runner
- ✅ Real-time updates
- ✅ Source code navigation
- ✅ Detailed error messages

## 📚 Documentation

- **Quick Reference**: This file
- **Detailed Guide**: `src/test/README.md`
- **Full Documentation**: `TESTING.md`

## 🎓 Learning Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 💡 Tips

1. **Always use `renderWithProviders`** instead of plain `render`
2. **Query by role** when possible (better for accessibility)
3. **Use `waitFor`** for async operations
4. **Test user behavior**, not implementation details
5. **Keep tests simple** and focused on one thing

## ✨ Next Steps

1. Run the example tests: `npm test`
2. Explore the test files in `src/components/__tests__/`
3. Write tests for your own components
4. Check coverage: `npm run test:coverage`

## 🆘 Need Help?

- Check `src/test/README.md` for detailed examples
- Look at existing test files for patterns
- Read `TESTING.md` for comprehensive documentation
- Ask your team for help

Happy testing! 🧪

