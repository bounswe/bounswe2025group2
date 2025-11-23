# Testing Setup for Mobile Frontend

## Required Dependencies

Install the following dependencies for testing:

```bash
npm install --save-dev @testing-library/react-native jest-fetch-mock
```

Or with yarn:

```bash
yarn add --dev @testing-library/react-native jest-fetch-mock
```

**Note:** As of @testing-library/react-native v12.4+, Jest matchers are built-in, so we don't need the deprecated `@testing-library/jest-native` package.

## Jest Configuration

Ensure `jest.config.js` exists in the root of mobile_frontend:

```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-paper|@react-navigation|@tanstack/react-query)/)',
  ],
  moduleNameMapper: {
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
  },
  testEnvironment: 'node',
};
```

## Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test Profile.test.tsx
```

## Common Issues

### Module Resolution Errors

If you encounter module resolution errors, ensure your `moduleNameMapper` in `jest.config.js` matches your TypeScript path aliases.

### React Native Mocks

The `jest.setup.js` file includes necessary mocks for:
- AsyncStorage
- React Native Paper components
- React Navigation
- Image picker
- Cookies
- DateTimePicker

### Fetch Mocking

We use `jest-fetch-mock` to mock API calls. In your tests, you can control responses:

```typescript
fetch.mockResponseOnce(JSON.stringify({ data: 'mock data' }));
```
