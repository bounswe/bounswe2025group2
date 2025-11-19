/**
 * Mock for @react-native-cookies/cookies
 */
export default {
  get: jest.fn(() => Promise.resolve({})),
  set: jest.fn(() => Promise.resolve(true)),
  clearAll: jest.fn(() => Promise.resolve(true)),
  getAll: jest.fn(() => Promise.resolve({})),
  clearByName: jest.fn(() => Promise.resolve(true)),
};
