/**
 * Authentication Service for GenFit Frontend
 * Handles login, logout, registration, and user session management
 */

import GFapi from '../api/GFapi';
import type { LoginCredentials, RegisterData, User } from '../types/api';

export class AuthService {
  /**
   * Login user with credentials
   */
  static async login(credentials: LoginCredentials): Promise<{message: string}> {
    return await GFapi.post<{message: string}>('/api/login/', credentials);
  }

  /**
   * Register new user
   */
  static async register(data: RegisterData): Promise<{message: string, user_id: number}> {
    return await GFapi.post<{message: string, user_id: number}>('/api/register/', data);
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    await GFapi.post('/api/logout/');
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      return await GFapi.get<User>('/api/user/');
    } catch (error: any) {
      // If user is not authenticated, return null
      if (error?.status === 401 || error?.status === 403) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch {
      return false;
    }
  }

}

export default AuthService;
