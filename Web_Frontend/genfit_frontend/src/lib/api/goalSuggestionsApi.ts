/**
 * Goal Suggestions API Service
 * Handles AI-powered goal suggestions
 */

import GFapi from './GFapi';

export interface GoalSuggestion {
  is_realistic: boolean;
  warning_message: string | null;
  target_value: number;
  unit: string;
  days_to_complete: number;
  goal_type: 'WALKING_RUNNING' | 'WORKOUT' | 'CYCLING' | 'SWIMMING' | 'SPORTS';
  tips: [string, string, string];
}

export interface GoalSuggestionsRequest {
  title: string;
  description?: string;
}

export interface GoalSuggestionsError {
  error: string;
  detail?: string;
  retry_after_seconds?: number;
}

/**
 * Get AI-powered suggestions for a fitness goal
 */
export const getGoalSuggestions = async (
  request: GoalSuggestionsRequest
): Promise<GoalSuggestion> => {
  try {
    const response = await GFapi.post<GoalSuggestion>(
      '/api/goals/suggestions/',
      request
    );
    return response;
  } catch (error: any) {
    // Handle rate limiting (429)
    if (error.status === 429) {
      const retryAfter = error.response?.headers?.get('retry-after');
      const waitMinutes = retryAfter ? Math.ceil(parseInt(retryAfter) / 60) : 'a few';
      
      throw new Error(
        `You've reached the limit of 10 suggestions per hour. Please try again in ${waitMinutes} minutes.`
      );
    }
    
    // Handle validation errors (400)
    if (error.status === 400) {
      const errorData = error.data || {};
      throw new Error(errorData.error || 'Invalid goal details. Please check your input.');
    }
    
    // Handle server errors (500)
    if (error.status === 500) {
      throw new Error('Our AI service is temporarily unavailable. Please try again in a few moments.');
    }
    
    // Handle network errors
    if (!error.status) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw new Error(error.message || 'Unable to connect to suggestion service.');
  }
};

/**
 * Calculate target date from days_to_complete
 */
export const calculateTargetDate = (daysToComplete: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysToComplete);
  return date.toISOString().split('T')[0];
};
