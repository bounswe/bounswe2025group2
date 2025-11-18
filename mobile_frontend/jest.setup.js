/**
 * Jest setup file for configuring the test environment
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Setup global mocks
global.fetch = jest.fn();
global.URL = {
  createObjectURL: jest.fn(() => 'mocked-blob-url'),
  revokeObjectURL: jest.fn(),
};

// Silence console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
