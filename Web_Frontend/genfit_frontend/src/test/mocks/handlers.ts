/**
 * Mock API Handlers
 * Define mock responses for API endpoints used in tests
 */

import { vi } from 'vitest';

/**
 * Mock user data
 */
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  profile_picture: null,
  user_type: 'member',
  is_verified_coach: false,
};

/**
 * Mock goals data
 */
export const mockGoals = [
  {
    id: 1,
    title: 'Lose 10 pounds',
    description: 'Weight loss goal',
    user: 1,
    goal_type: 'weight_loss',
    target_value: 10,
    current_value: 5,
    unit: 'pounds',
    start_date: '2025-01-01',
    target_date: '2025-12-31',
    status: 'ACTIVE',
    last_updated: '2025-01-01',
  },
  {
    id: 2,
    title: 'Run 5K',
    description: 'Running goal',
    user: 1,
    goal_type: 'distance',
    target_value: 5,
    current_value: 3.75,
    unit: 'km',
    start_date: '2025-01-15',
    target_date: '2025-11-30',
    status: 'ACTIVE',
    last_updated: '2025-01-15',
  },
];

/**
 * Mock challenges data
 */
export const mockChallenges = [
  {
    id: 1,
    title: '30-Day Fitness Challenge',
    description: 'Complete 30 days of workouts',
    start_date: '2025-11-01',
    end_date: '2025-11-30',
    target_value: 30,
    challenge_type: 'workout',
    difficulty_level: 'Intermediate' as const,
    unit: 'days',
    difficulty_level: 'Intermediate',
    created_at: '2025-11-01',
    coach: 1,
    coach_username: 'Coach Sarah',
    is_active: true,
    is_joined: true,
    participant_count: 150,
  },
  {
    id: 2,
    title: 'Healthy Eating Challenge',
    description: 'Eat healthy for 21 days',
    start_date: '2025-11-10',
    end_date: '2025-12-01',
    target_value: 21,
    challenge_type: 'nutrition',
    difficulty_level: 'Beginner' as const,
    unit: 'days',
    difficulty_level: 'Beginner',
    created_at: '2025-11-10',
    coach: 1,
    coach_username: 'Coach Mike',
    is_active: true,
    is_joined: false,
    participant_count: 200,
  },
];

/**
 * Mock login stats data
 */
export const mockLoginStats = {
  current_streak: 5,
  longest_streak: 10,
  total_login_days: 25,
  last_login_date: '2025-11-11',
  logged_in_today: true,
  streak_active: true,
  days_until_break: 2,
  login_calendar: [
    { date: '2025-11-11', logged_in: true },
    { date: '2025-11-10', logged_in: true },
    { date: '2025-11-09', logged_in: true },
    { date: '2025-11-08', logged_in: true },
    { date: '2025-11-07', logged_in: true },
  ],
};

/**
 * Mock daily quote data
 */
export const mockDailyQuote = {
  text: 'The only bad workout is the one that didn\'t happen.',
  author: 'Unknown',
};

/**
 * Mock food items for nutrition analyzer
 */
export const mockFoodItems = [
  {
    food_name: 'egg',
    serving_qty: 2,
    serving_unit: 'large',
    serving_weight_grams: 100,
    nf_calories: 143,
    nf_protein: 12.6,
    nf_total_carbohydrate: 0.7,
    nf_total_fat: 9.5,
  },
  {
    food_name: 'banana',
    serving_qty: 1,
    serving_unit: 'medium',
    serving_weight_grams: 118,
    nf_calories: 105,
    nf_protein: 1.3,
    nf_total_carbohydrate: 27,
    nf_total_fat: 0.4,
  },
];

/**
 * Create mock API responses
 */
export const createMockApiResponse = <T,>(data: T, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  } as unknown as Response;
};

/**
 * Mock fetch implementation for testing
 */
export const createMockFetch = () => {
  return vi.fn((url: string | URL) => {
    const urlString = url.toString();

    // User endpoint
    if (urlString.includes('/api/user/') && !urlString.includes('login-stats')) {
      return Promise.resolve(createMockApiResponse(mockUser));
    }

    // Login stats endpoint
    if (urlString.includes('/api/user/login-stats/')) {
      return Promise.resolve(createMockApiResponse(mockLoginStats));
    }

    // Goals endpoint
    if (urlString.includes('/api/goals/')) {
      return Promise.resolve(createMockApiResponse(mockGoals));
    }

    // Challenges endpoint
    if (urlString.includes('/api/challenges/')) {
      return Promise.resolve(createMockApiResponse(mockChallenges));
    }

    // Daily quote endpoint
    if (urlString.includes('/api/daily-quote/')) {
      return Promise.resolve(createMockApiResponse(mockDailyQuote));
    }

    // Food parsing endpoint
    if (urlString.includes('/api/parse_food/')) {
      return Promise.resolve(createMockApiResponse({ foods: mockFoodItems }));
    }

    // Default: return empty response
    return Promise.resolve(createMockApiResponse({}));
  });
};

