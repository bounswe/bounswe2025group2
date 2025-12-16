import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../constants/api';
import { useAuth } from '../context/AuthContext';
import Cookies from '@react-native-cookies/cookies';

export interface FitnessGoal {
  id: number;
  user: number;
  mentor: number | null;
  goal_type: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: string;
  last_updated: string;
  progress_percentage: number;
}

export interface GoalFormData {
  title: string;
  description: string;
  goal_type: string;
  target_value: number;
  unit: string;
  target_date: string;
}

const GOAL_TYPE_UNITS: Record<string, string[]> = {
  'WALKING_RUNNING': ['km', 'miles', 'steps'],
  'WORKOUT': ['minutes', 'hours', 'sets', 'reps'],
  'CYCLING': ['km', 'miles', 'minutes', 'hours'],
  'SWIMMING': ['laps', 'meters', 'km', 'minutes'],
  'SPORTS': ['matches', 'points', 'goals', 'minutes', 'hours'],
  'YOGA': ['minutes', 'sessions', 'hours'],
  'WEIGHTLIFTING': ['kg', 'lbs', 'reps', 'sets'],
  'HIKING': ['km', 'miles', 'hours', 'elevation'],
  'STEP_COUNT': ['steps', 'km', 'miles'],
  'MEDITATION': ['minutes', 'sessions'],
  'BASKETBALL': ['games', 'points', 'minutes'],
  'FOOTBALL': ['games', 'goals', 'minutes'],
  'TENNIS': ['matches', 'sets', 'minutes']
};

export const GOAL_TYPES = [
  { label: 'Walking/Running', value: 'WALKING_RUNNING' },
  { label: 'Workout', value: 'WORKOUT' },
  { label: 'Cycling', value: 'CYCLING' },
  { label: 'Swimming', value: 'SWIMMING' },
  { label: 'Sports', value: 'SPORTS' },
  { label: 'Yoga', value: 'YOGA' },
  { label: 'Weightlifting', value: 'WEIGHTLIFTING' },
  { label: 'Hiking', value: 'HIKING' },
  { label: 'Daily Steps', value: 'STEP_COUNT' },
  { label: 'Meditation', value: 'MEDITATION' },
  { label: 'Basketball', value: 'BASKETBALL' },
  { label: 'Football/Soccer', value: 'FOOTBALL' },
  { label: 'Tennis', value: 'TENNIS' },
];

export const GOAL_STATUSES = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Restarted', value: 'RESTARTED' },
];

export const getSuggestedUnits = (goalType: string): string[] => {
  return GOAL_TYPE_UNITS[goalType] || [];
};

const getSanitizedAuthHeader = (token: string | null): Record<string, string> => {
  if (!token || token.length === 0) {
    return {};
  }
  return { Authorization: token };
};

// Hook to fetch user's goals
export const useGoals = (username?: string) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['goals', username],
    queryFn: async () => {
      const params = username ? `?username=${username}` : '';
      const response = await fetch(`${API_URL}goals/${params}`, {
        headers: getSanitizedAuthHeader(token),
      });
      if (!response.ok) throw new Error('Failed to fetch goals');
      return response.json() as Promise<FitnessGoal[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch a specific goal
export const useGoalDetail = (goalId: number | null) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['goal', goalId],
    queryFn: async () => {
      if (!goalId) return null;
      const response = await fetch(`${API_URL}goals/${goalId}/`, {
        headers: getSanitizedAuthHeader(token),
      });
      if (!response.ok) throw new Error('Failed to fetch goal');
      return response.json() as Promise<FitnessGoal>;
    },
    enabled: !!goalId,
    staleTime: 60 * 1000, // 1 minute
  });
};

// Hook to create a goal
export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (data: GoalFormData & { user?: number }) => {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');

      const response = await fetch(`${API_URL}goals/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getSanitizedAuthHeader(token),
          'Referer': origin,
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create goal');
      }
      return response.json() as Promise<FitnessGoal>;
    },
    onSuccess: (data) => {
      // Invalidate all goal queries
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      if (data.user) {
        queryClient.invalidateQueries({ queryKey: ['goals', `user_${data.user}`] });
      }
    },
  });
};

// Hook to update a goal
export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async ({ goalId, data }: { goalId: number; data: Partial<GoalFormData> }) => {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');

      const response = await fetch(`${API_URL}goals/${goalId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getSanitizedAuthHeader(token),
          'Referer': origin,
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update goal');
      }
      return response.json() as Promise<FitnessGoal>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', data.id] });
    },
  });
};

// Hook to update goal progress
export const useUpdateGoalProgress = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async ({ goalId, currentValue, status }: { goalId: number; currentValue?: number; status?: string }) => {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');

      const payload: any = {};
      if (currentValue !== undefined) payload.current_value = currentValue;
      if (status !== undefined) payload.status = status;

      const response = await fetch(`${API_URL}goals/${goalId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getSanitizedAuthHeader(token),
          'Referer': origin,
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update goal progress');
      }
      return response.json() as Promise<FitnessGoal>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', data.id] });
    },
  });
};

// Hook to delete a goal
export const useDeleteGoal = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (goalId: number) => {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      const origin = API_URL.replace(/\/api\/?$/, '');

      const response = await fetch(`${API_URL}goals/${goalId}/`, {
        method: 'DELETE',
        headers: {
          ...getSanitizedAuthHeader(token),
          'Referer': origin,
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete goal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};
