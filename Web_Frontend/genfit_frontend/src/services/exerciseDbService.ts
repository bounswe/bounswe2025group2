/**
 * ExerciseDB API Service
 * Handles communication with the backend ExerciseDB proxy API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Exercise {
  exerciseId: string;
  name: string;
  imageUrl: string;
  bodyParts: string[];
  equipments: string[];
  exerciseType: string;
  targetMuscles: string[];
  secondaryMuscles: string[];
  keywords: string[];
}

export interface ExerciseDetail extends Exercise {
  overview?: string;
  instructions?: string[];
  exerciseTips?: string[];
  variations?: string[];
  relatedExerciseIds?: string[];
  videoUrl?: string;
}

export interface ExerciseSearchResponse {
  success: boolean;
  data: Exercise[];
  meta: {
    total: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
  };
  rate_limit: {
    remaining_requests: number;
    reset_in_seconds: number;
  };
}

export interface FilterOption {
  name: string;
  imageUrl: string;
}

export interface ExerciseFilters {
  bodyParts: FilterOption[];
  equipments: FilterOption[];
}

export interface RateLimitStatus {
  requests_made: number;
  requests_remaining: number;
  limit: number;
  reset_in_seconds: number;
  period_hours: number;
}

export interface SearchParams {
  name?: string;
  bodyParts?: string;
  equipments?: string;
  keywords?: string;
  limit?: number;
}

/**
 * Search exercises from the ExerciseDB API
 */
export async function searchExercises(params: SearchParams): Promise<ExerciseSearchResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.name) queryParams.append('name', params.name);
  if (params.bodyParts) queryParams.append('bodyParts', params.bodyParts);
  if (params.equipments) queryParams.append('equipments', params.equipments);
  if (params.keywords) queryParams.append('keywords', params.keywords);
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/exercise-database/search/?${queryParams.toString()}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to search exercises: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get available filter options (body parts, equipment, etc.)
 */
export async function getExerciseFilters(): Promise<ExerciseFilters> {
  const response = await fetch(
    `${API_BASE_URL}/exercise-database/filters/`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch filters: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current rate limit status for the user
 */
export async function getRateLimitStatus(): Promise<RateLimitStatus> {
  const response = await fetch(
    `${API_BASE_URL}/exercise-database/rate-limit/`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch rate limit status: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get detailed information for a specific exercise by ID
 */
export async function getExerciseDetail(exerciseId: string): Promise<{
  success: boolean;
  data: ExerciseDetail;
  rate_limit: {
    remaining_requests: number;
    reset_in_seconds: number;
  };
}> {
  const response = await fetch(
    `${API_BASE_URL}/exercise-database/exercise/${exerciseId}/`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch exercise details: ${response.statusText}`);
  }

  return response.json();
}

