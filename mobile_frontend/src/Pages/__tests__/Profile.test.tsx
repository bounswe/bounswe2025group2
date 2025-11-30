import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Profile from '../Profile';

// Mock AuthContext
const mockGetAuthHeader = jest.fn(() => ({ Authorization: 'Bearer mock-token' }));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeader: mockGetAuthHeader,
    currentUser: { id: 1, username: 'testuser', email: 'test@test.com' },
    setCurrentUser: jest.fn(),
  }),
}));

describe('Profile Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
      logger: {
        log: () => {},
        warn: () => {},
        error: () => {},
      },
    });
    
    fetch.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should render loading indicator initially', () => {
    // Mock fetch to never resolve (simulates loading state)
    fetch.mockImplementation(() => new Promise(() => {}));

    const { getByTestId } = render(
      <QueryClientProvider client={queryClient}>
        <Profile />
      </QueryClientProvider>
    );
    
    // Verify loading indicator is shown
    expect(getByTestId('activity-indicator')).toBeTruthy();
  });

  it('should use HTTPS API endpoint', () => {
    // This test verifies that the component is configured to use HTTPS
    const { API_URL } = require('@constants/api');
    
    expect(API_URL).toContain('https://');
    expect(API_URL).toContain('genfit.website');
  });
});
