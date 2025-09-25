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

// Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
  withCredentials?: boolean;
}
