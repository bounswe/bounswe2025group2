import { API_URL } from '../constants/api';
import { useAuth } from '../context/AuthContext';

export interface ExerciseDbItem {
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

export interface ExerciseDbDetail extends ExerciseDbItem {
  overview?: string;
  instructions?: string[];
  exerciseTips?: string[];
  variations?: string[];
  relatedExerciseIds?: string[];
  videoUrl?: string;
}

export interface ExerciseDbSearchResponse {
  success: boolean;
  data: ExerciseDbItem[];
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

export interface ExerciseDbRateLimitStatus {
  requests_made: number;
  requests_remaining: number;
  limit: number;
  reset_in_seconds: number;
  period_hours: number;
}

export interface ExerciseDbSearchParams {
  name?: string;
  bodyParts?: string;
  equipments?: string;
  keywords?: string;
  limit?: number;
}

const getAuthHeader = (token: string | null): Record<string, string> => {
  if (!token || token.length === 0) {
    return {};
  }
  return { Authorization: token };
};

export const useExerciseDbApi = () => {
  const { token } = useAuth();

  const baseUrl = API_URL.endsWith('/')
    ? `${API_URL}exercise-database`
    : `${API_URL}/exercise-database`;

  const searchExercises = async (
    params: ExerciseDbSearchParams
  ): Promise<ExerciseDbSearchResponse> => {
    const queryParams = new URLSearchParams();

    if (params.name) queryParams.append('name', params.name);
    if (params.bodyParts) queryParams.append('bodyParts', params.bodyParts);
    if (params.equipments) queryParams.append('equipments', params.equipments);
    if (params.keywords) queryParams.append('keywords', params.keywords);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(
      `${baseUrl}/search/?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(token),
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      let message = 'Failed to search exercises.';
      try {
        const errorData = await response.json();
        if (errorData?.message) {
          message = errorData.message;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return response.json();
  };

  const getExerciseDetail = async (
    exerciseId: string
  ): Promise<{
    success: boolean;
    data: ExerciseDbDetail;
    rate_limit: {
      remaining_requests: number;
      reset_in_seconds: number;
    };
  }> => {
    const response = await fetch(`${baseUrl}/exercise/${exerciseId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      let message = 'Failed to fetch exercise details.';
      try {
        const errorData = await response.json();
        if (errorData?.message) {
          message = errorData.message;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    return response.json();
  };

  const getRateLimitStatus = async (): Promise<ExerciseDbRateLimitStatus> => {
    const response = await fetch(`${baseUrl}/rate-limit/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(token),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch exercise database rate limit status.');
    }

    return response.json();
  };

  return {
    searchExercises,
    getExerciseDetail,
    getRateLimitStatus,
  };
};


