/**
 * API Types and Interfaces for GenFit Frontend
 */

// Base API Response Structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API Request Configuration
export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

// Error Handling
export interface ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  user_type: 'User' | 'Coach';
}

export interface User {
  id: number;
  username: string;
  email: string;
  user_type: string;
  is_verified_coach: boolean;
  current_streak?: number;
  longest_streak?: number;
  last_login_date?: string;
  total_login_days?: number;
  daily_advice_enabled?: boolean;
}

export interface UserSearchResult {
  id: number;
  username: string;
  user_type: string;
  is_verified_coach: boolean;
}

export interface LoginStats {
  current_streak: number;
  longest_streak: number;
  total_login_days: number;
  last_login_date: string | null;
  streak_active: boolean;
  days_until_break: number | null;
  login_calendar: Array<{
    date: string;
    logged_in: boolean;
  }>;
  logged_in_today: boolean;
}

// Goal Types
export interface Goal {
  id: number;
  title: string;
  description: string;
  user: number;
  mentor?: number | null;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: string;
  last_updated: string;
  progress_percentage?: number;
  progress?: number; // computed field for compatibility
}

// Challenge Types
export interface Challenge {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  target_value: number;
  challenge_type: string;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  unit: string;
  location?: string;
  longitude?: number;
  latitude?: number;
  created_at: string;
  min_age?: number;
  max_age?: number;
  coach: number; // Coach user ID from backend
  is_active: boolean; // From backend serializer
  // Frontend-only fields
  coach_username?: string; // Coach name to display (calculated in frontend)
  participant_count?: number;
  is_joined?: boolean;
  user_progress?: number; // Current user's progress
  user_ranking?: number; // Current user's rank
  progress_percentage?: number; // Calculated progress %
}

export interface ChallengeParticipant {
  id: number;
  user: number;
  username: string;
  current_value: number;
  joined_date: string;
  last_updated: string;
}

export interface ChallengeProgress {
  challenge: string;
  current_value: number;
  progress_percentage: number;
}

export interface CreateChallengeData {
  title: string;
  description: string;
  challenge_type: string;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  target_value: number;
  unit: string;
  start_date: string;
  end_date: string;
}

export interface LeaderboardEntry {
  user_id: number;
  username: string;
  current_value: number;
  progress_percentage: number;
  ranking: number;
  last_updated: string;
  completion_time?: string;
}

export interface ChallengeHistory {
  challenge: Challenge;
  final_ranking: number;
  final_progress: number;
  completion_status: 'COMPLETED' | 'ABANDONED' | 'EXPIRED';
  joined_date: string;
  completion_date?: string;
}
// Forum Types
export interface Forum {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
  order: number;
  thread_count: number;
}

//Thread types
export interface ForumThread {
  id: number;
  title: string;
  content: string;
  author: string;
  forum: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  last_activity: string;
  is_bookmarked?: boolean;
}

//Comment types
export interface Comment {
  id: number;
  author_id: number;
  author_username: string;
  thread_id: number;
  content: string;
  like_count: number;
  subcomment_count: number;
  created_at: string;
  updated_at: string;
}

export interface Subcomment {
  id: number;
  author_id: number;
  author_username: string;
  comment_id: number;
  content: string;
  like_count: number;
  created_at: string;
  updated_at: string;
}

// Vote Types
export interface Vote {
  id: number;
  user: number;
  user_username: string;
  content_type: string;
  content_id: number;
  vote_type: 'UPVOTE' | 'DOWNVOTE';
  created_at: string;
  updated_at: string;
}

// Quote Types
export interface Quote {
  text: string;
  author: string;
}

// Daily Advice Types
export interface DailyAdvice {
  id?: number;
  user?: number;
  advice_text?: string;
  date?: string;
  created_at?: string;
  enabled: boolean;
  message?: string;
}

// User Settings Types
export interface UserSettings {
  daily_advice_enabled: boolean;
}

// Chat Types
export interface ChatUser {
  id: number;
  username: string;
}

export interface Message {
  id: number;
  sender: string;
  body: string;
  created: string;
  is_read: boolean;
}

export interface Chat {
  id: number;
  participants: ChatUser[];
  other_user: ChatUser;
  created: string;
  last_message: {
    body: string;
    created: string;
    sender: string;
  } | null;
  unread_count: number;
}

// AI Tutor Types
export interface AiTutorChat {
  id: number;
  chat_id: string;
  created_at: string;
  is_ai: boolean;
}

export interface AiMessage {
  id: number;
  message: string;
  created_at: string;
  sender: string;
}

// Nutrition Types
export interface NutrientValue {
  value: number;
  unit: string;
}

export interface FoodItem {
  fdcId: number;
  description: string;
  brandOwner: string;
  brandName: string;
  ingredients: string;
  servingSize: number | null;
  servingSizeUnit: string;
  nutrients: {
    'Energy'?: NutrientValue;
    'Protein'?: NutrientValue;
    'Total lipid (fat)'?: NutrientValue;
    'Carbohydrate, by difference'?: NutrientValue;
    'Fiber, total dietary'?: NutrientValue;
    'Total Sugars'?: NutrientValue;
    'Sodium, Na'?: NutrientValue;
    'Potassium, K'?: NutrientValue;
    'Calcium, Ca'?: NutrientValue;
    'Iron, Fe'?: NutrientValue;
    'Vitamin C, total ascorbic acid'?: NutrientValue;
    'Cholesterol'?: NutrientValue;
    'Fatty acids, total saturated'?: NutrientValue;
    'Caffeine'?: NutrientValue;
    'Vitamin D (D2 + D3)'?: NutrientValue;
    'Vitamin E (alpha-tocopherol)'?: NutrientValue;
    'Vitamin B-12'?: NutrientValue;
  };
}

export interface NutritionResponse {
  totalHits: number;
  query: string;
  foods: FoodItem[];
}

// Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  withCredentials?: boolean;
}
