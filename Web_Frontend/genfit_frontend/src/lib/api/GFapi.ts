/**
 * GenFit API Client (GFapi)
 */

import type {
  ApiRequestConfig,
  ApiError,
  ApiConfig,
} from '../types/api';

class GFApiClient {
  private config: Required<ApiConfig>;

  constructor(config: ApiConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout ?? 10000,
      withCredentials: config.withCredentials ?? true,
    };
  }

  /**
   * Get CSRF token from cookies for Django CSRF protection
   */
  private getCSRFToken(): string | null {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Create full URL from endpoint
   */
  private createUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return url.toString();
  }

  /**
   * Prepare request headers
   */
  private prepareHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    // Add CSRF token for Django
    const csrfToken = this.getCSRFToken();
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }

    return headers;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage: string;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || response.statusText;
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }

      const error: ApiError = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = response;
      
      throw error;
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    try {
      return await response.json();
    } catch {
      // If JSON parsing fails, return the response text
      const text = await response.text();
      return text as unknown as T;
    }
  }

  /**
   * Make HTTP request
   */
  private async makeRequest<T>(config: ApiRequestConfig): Promise<T> {
    const { method, url, data, params, headers: customHeaders } = config;
    
    const fullUrl = this.createUrl(url, params);
    const headers = this.prepareHeaders(customHeaders);

    const requestInit: RequestInit = {
      method,
      headers,
      credentials: this.config.withCredentials ? 'include' : 'omit',
    };

    // Add body for methods that support it
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestInit.body = JSON.stringify(data);
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(fullUrl, {
        ...requestInit,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.makeRequest<T>({ method: 'GET', url, params });
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>({ method: 'POST', url, data });
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>({ method: 'PUT', url, data });
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>({ method: 'PATCH', url, data });
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string): Promise<T> {
    return this.makeRequest<T>({ method: 'DELETE', url });
  }

  /**
   * Generic request method for custom configurations
   */
  async request<T>(config: ApiRequestConfig): Promise<T> {
    return this.makeRequest<T>(config);
  }

  /**
   * Update API configuration
   */
  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<ApiConfig> {
    return { ...this.config };
  }
}

// Create and export the default API client instance
const GFapi = new GFApiClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  withCredentials: true,
});

export { GFapi, GFApiClient };
export default GFapi;
