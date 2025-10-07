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
}

// Goal Types
export interface Goal {
  id: number;
  title: string;
  description: string;
  user: number;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: string;
  last_updated: string;
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

// Forum Thread Types
export interface ForumThread {
  id: number;
  title: string;
  author: string;
  comment_count: number;
  created_at: string;
  forum: string;
  like_count: number;
  view_count: number;
}

// Quote Types
export interface Quote {
  text: string;
  author: string;
}

// Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  withCredentials?: boolean;
}
