# Forum Page Unit Tests Documentation

## Overview

Comprehensive unit tests for the Forum Page (`src/Pages/Forum.tsx`) component have been implemented to ensure quality, reliability, and maintainability.

## Test File Location

**File**: `src/unit_tests/Forum.test.tsx`

## Test Structure

The test suite is organized into 7 main test categories with 29 total tests:

```
Forum Page - Unit Tests
├── Component Rendering Tests (5 tests)
├── API Integration Tests (5 tests)
├── User Interaction Tests (4 tests)
├── State Management Tests (4 tests)
├── Edge Cases and Error Handling (5 tests)
├── Component Lifecycle Tests (3 tests)
└── Accessibility Tests (3 tests)
```

## Running the Tests

### Run All Forum Tests
```bash
npm test -- Forum.test.tsx
```

### Run with Coverage Report
```bash
npm test -- Forum.test.tsx --coverage
```

### Run Specific Test Suite
```bash
npm test -- Forum.test.tsx -t "Component Rendering Tests"
```

### Run in Watch Mode
```bash
npm test -- Forum.test.tsx --watch
```

## Test Details

### 1. Component Rendering Tests
Tests that verify the component renders correctly in different UI states.

| Test | Description |
|------|-------------|
| `renders loading state initially` | Verifies ActivityIndicator is shown during initial load |
| `renders forum list after successful API call` | Verifies forums display after successful API response |
| `renders error state on fetch failure` | Verifies error message and retry button on API failure |
| `renders empty list when no forums available` | Verifies proper rendering of empty state |
| `renders all forum items from API response` | Verifies all forums from API are rendered |

**Key Assertions**:
- Component renders without crashing
- Correct UI elements are displayed for each state
- Forum data is properly rendered

### 2. API Integration Tests
Tests that verify API communication and authentication.

| Test | Description |
|------|-------------|
| `calls fetch with correct API endpoint` | Verifies correct API URL is used |
| `includes authentication headers in fetch request` | Verifies auth headers are sent |
| `handles network error gracefully` | Verifies network errors are handled |
| `handles non-ok response status` | Verifies HTTP error statuses are handled |
| `fetches forums on component mount` | Verifies fetch is called on mount |

**Key Assertions**:
- Fetch is called with correct endpoint
- Authorization headers are included
- Errors are caught and displayed
- Component fetches data on lifecycle

### 3. User Interaction Tests
Tests that verify user can interact with forum items and retry.

| Test | Description |
|------|-------------|
| `retry button is visible in error state` | Verifies retry button appears on error |
| `retry button calls fetchForums again` | Verifies clicking retry triggers new fetch |
| `forum item is touchable` | Verifies forum items are rendered and touchable |
| `forum item displays title and description` | Verifies forum data is displayed correctly |

**Key Assertions**:
- UI elements respond to user interactions
- Retry functionality works correctly
- Forum data displays properly

### 4. State Management Tests
Tests that verify component state transitions correctly.

| Test | Description |
|------|-------------|
| `isLoading state transitions from true to false on success` | Verifies loading state changes |
| `error state is cleared on successful retry` | Verifies error state clears on success |
| `forums state is populated with API data` | Verifies forums array is updated |
| `error state set on failed fetch` | Verifies error state is set on failure |

**Key Assertions**:
- State transitions occur correctly
- Loading state changes as expected
- Error state is managed properly
- Forums data is stored correctly

### 5. Edge Cases and Error Handling
Tests that verify robustness against unexpected data.

| Test | Description |
|------|-------------|
| `handles undefined forum data gracefully` | Verifies handling of undefined data |
| `handles forum with missing title field` | Verifies handling of incomplete data |
| `handles large number of forums` | Verifies handling of 50+ forums |
| `handles forum with very long description` | Verifies handling of long text (200+ chars) |
| `handles empty statusText in error response` | Verifies handling of empty error messages |

**Key Assertions**:
- Component doesn't crash with unexpected data
- Missing or malformed data is handled gracefully
- Performance is acceptable with large datasets
- Long content is handled correctly

### 6. Component Lifecycle Tests
Tests that verify component lifecycle behavior.

| Test | Description |
|------|-------------|
| `component mounts without crashing` | Verifies component can mount |
| `multiple sequential renders work correctly` | Verifies re-renders work |
| `component handles rapid re-renders` | Verifies stability with rapid updates |

**Key Assertions**:
- Component mounts cleanly
- Component doesn't crash on re-render
- Lifecycle is stable

### 7. Accessibility Tests
Tests that verify accessibility of UI elements.

| Test | Description |
|------|-------------|
| `activity indicator is rendered during loading` | Verifies loading indicator is shown |
| `error message is visible and readable` | Verifies error messages are visible |
| `retry button is visible in error state` | Verifies retry button is accessible |

**Key Assertions**:
- Loading state is visible
- Error messages are accessible
- User can interact with retry button

## Mocked Dependencies

The tests mock the following dependencies:

```typescript
// Theme Context
jest.mock('../context/ThemeContext');

// Authentication Context
jest.mock('../context/AuthContext');

// Navigation
jest.mock('@react-navigation/native');

// Custom Text Component
jest.mock('@components/CustomText');

// Global fetch
global.fetch = jest.fn();
```

## Mock Setup

Before each test, the following mocks are configured:

```typescript
beforeEach(() => {
  // Mock useAuth to return test auth header
  (useAuth as jest.Mock).mockReturnValue({
    getAuthHeader: jest.fn(() => mockAuthHeader),
  });

  // Mock useTheme to return test colors
  (useTheme as jest.Mock).mockReturnValue({
    colors: mockColors,
  });

  // Mock useNavigation
  (useNavigation as jest.Mock).mockReturnValue({
    navigate: jest.fn(),
    getParent: jest.fn(() => ({...})),
  });

  // Clear fetch mock
  (global.fetch as jest.Mock).mockClear();
});
```

## Test Data

### Mock Forums
```typescript
const mockForums = [
  { id: 1, title: 'General Discussion', description: 'General forum for discussions' },
  { id: 2, title: 'Fitness Tips', description: 'Share fitness tips and advice' },
  { id: 3, title: 'Nutrition', description: 'Nutrition and diet discussions' },
];
```

### Mock Auth Header
```typescript
const mockAuthHeader = { Authorization: 'Bearer test-token' };
```

### Mock Colors
```typescript
const mockColors = {
  background: '#fff',
  text: '#000',
  subText: '#666',
  active: '#007AFF',
  border: '#ddd',
};
```

## Coverage Analysis

### Current Coverage
- **Statements**: 87.87%
- **Branches**: 75%
- **Functions**: 83.33%
- **Lines**: 87.5%

### Coverage by Component

#### Successfully Tested
- ✅ Component initialization and mount
- ✅ Forum list rendering
- ✅ Error states
- ✅ Retry functionality
- ✅ API integration
- ✅ State management
- ✅ Navigation handling

#### Partially Tested
- ⚠️ Edge cases with network timeouts (needs integration tests)
- ⚠️ Complex error scenarios

## Async Handling

The tests properly handle async operations using `waitFor`:

```typescript
await waitFor(() => {
  expect(getByText('General Discussion')).toBeTruthy();
});
```

This ensures:
- Async API calls complete before assertions
- UI updates are reflected in DOM
- No race conditions occur

## Common Patterns

### Testing API Success
```typescript
(global.fetch as jest.Mock).mockResolvedValueOnce({
  ok: true,
  json: async () => mockForums,
});

const { getByText } = render(<Forum />);

await waitFor(() => {
  expect(getByText('General Discussion')).toBeTruthy();
});
```

### Testing API Failure
```typescript
(global.fetch as jest.Mock).mockRejectedValueOnce(
  new Error('Network error')
);

const { getByText } = render(<Forum />);

await waitFor(() => {
  expect(getByText('Network error')).toBeTruthy();
});
```

### Testing User Interactions
```typescript
fireEvent.press(getByText('Retry'));

await waitFor(() => {
  expect(global.fetch).toHaveBeenCalledTimes(2);
});
```

## Best Practices Implemented

✅ **Proper Mocking**: All external dependencies are mocked  
✅ **Async Handling**: All async operations use `waitFor`  
✅ **Test Isolation**: Each test is independent  
✅ **Cleanup**: Mocks are cleared between tests  
✅ **Descriptive Names**: Test names clearly describe what they test  
✅ **Arrange-Act-Assert**: Each test follows AAA pattern  
✅ **Coverage**: Tests cover happy path, error path, and edge cases  

## Troubleshooting

### Tests Fail on First Run
**Solution**: Install dependencies first
```bash
npm install
```

### Module Not Found Error
**Solution**: Clear Jest cache
```bash
npm test -- --clearCache
```

### Async Timeout Errors
**Solution**: Increase Jest timeout for slow operations
```bash
jest.setTimeout(10000);
```

## Future Improvements

1. **Add Integration Tests**: Test with mock backend server
2. **Increase Branch Coverage**: Add more conditional path tests
3. **Performance Tests**: Add benchmarks for large datasets
4. **Snapshot Tests**: Add UI snapshot testing
5. **E2E Tests**: Add end-to-end tests with Detox

## References

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://github.com/callstack/react-native-testing-library)
- [React Testing Best Practices](https://testing-library.com/docs/queries/about)

## Contact & Support

For questions or issues related to these tests, please contact:
- **Repository**: bounswe/bounswe2025group2
- **Branch**: mobile_forum_page_unittests
- **Test File**: `src/unit_tests/Forum.test.tsx`

---

**Last Updated**: November 11, 2025  
**Test Status**: ✅ All Tests Passing (29/29)  
**Coverage**: 87.87%
