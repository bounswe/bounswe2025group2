/**
 * Mentor Service
 * 
 * This service handles all API calls related to the mentor-mentee system.
 * It provides functions for:
 * - Searching and discovering mentors
 * - Sending and managing mentorship requests
 * - Managing mentor-mentee relationships
 * - Setting and tracking mentee goals
 * - Providing feedback and guidance
 */

import CookieManager from '@react-native-cookies/cookies';
import {
  MentorshipRequest,
  MentorshipRelationship,
  MentorProfile,
  MenteeGoal,
  CreateMentorshipRequestPayload,
  RespondToMentorshipRequestPayload,
  CreateMenteeGoalPayload,
  ProvideFeedbackPayload,
  MentorSearchFilters,
  UpdateProfileVisibilityPayload,
} from '../types/mentor';

// API Base URL - matches the existing implementation
const API_BASE_URL = 'http://164.90.166.81:8000/api';

/**
 * Fetches CSRF token from cookies for authenticated requests
 */
const getCSRFToken = async (): Promise<string> => {
  try {
    const cookies = await CookieManager.get('http://164.90.166.81:8000');
    return cookies?.csrftoken?.value || '';
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return '';
  }
};

/**
 * Makes an authenticated API request
 */
const makeAuthRequest = async (
  endpoint: string,
  options: RequestInit,
  authHeader: { Authorization: string } | {}
): Promise<Response> => {
  const csrfToken = await getCSRFToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeader,
  };

  if (csrfToken && (options.method === 'POST' || options.method === 'PUT' || 
      options.method === 'PATCH' || options.method === 'DELETE')) {
    headers['X-CSRFToken'] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
    credentials: 'include',
  });

  return response;
};

// ────────────────────────────────────────────────────────────────────────────
// 🔍 MENTOR SEARCH & DISCOVERY
// ────────────────────────────────────────────────────────────────────────────

/**
 * Search for mentors based on filters
 */
export const searchMentors = async (
  filters: MentorSearchFilters,
  authHeader: { Authorization: string } | {}
): Promise<MentorProfile[]> => {
  const queryParams = new URLSearchParams();
  
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.location) queryParams.append('location', filters.location);
  if (filters.specialization) queryParams.append('specialization', filters.specialization);
  if (filters.min_rating) queryParams.append('min_rating', filters.min_rating.toString());
  if (filters.user_type) queryParams.append('user_type', filters.user_type);

  const endpoint = `/mentors/search/?${queryParams.toString()}`;
  const response = await makeAuthRequest(endpoint, { method: 'GET' }, authHeader);

  if (!response.ok) {
    throw new Error(`Failed to search mentors: ${response.status}`);
  }

  return response.json();
};

/**
 * Get list of available mentors
 */
export const getAvailableMentors = async (
  authHeader: { Authorization: string } | {}
): Promise<MentorProfile[]> => {
  const response = await makeAuthRequest('/mentors/', { method: 'GET' }, authHeader);

  if (!response.ok) {
    throw new Error(`Failed to fetch mentors: ${response.status}`);
  }

  return response.json();
};

/**
 * Get mentor details by username
 */
export const getMentorByUsername = async (
  username: string,
  authHeader: { Authorization: string } | {}
): Promise<MentorProfile> => {
  const response = await makeAuthRequest(
    `/mentors/${username}/`,
    { method: 'GET' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch mentor details: ${response.status}`);
  }

  return response.json();
};

// ────────────────────────────────────────────────────────────────────────────
// 📨 MENTORSHIP REQUESTS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Send a mentorship request (either as mentor or mentee)
 */
export const sendMentorshipRequest = async (
  payload: CreateMentorshipRequestPayload,
  authHeader: { Authorization: string } | {}
): Promise<MentorshipRequest> => {
  const response = await makeAuthRequest(
    '/mentorship/requests/',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    authHeader
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to send request: ${response.status}`);
  }

  return response.json();
};

/**
 * Get all mentorship requests (incoming and outgoing)
 */
export const getMentorshipRequests = async (
  authHeader: { Authorization: string } | {}
): Promise<{ incoming: MentorshipRequest[]; outgoing: MentorshipRequest[] }> => {
  const response = await makeAuthRequest(
    '/mentorship/requests/',
    { method: 'GET' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch requests: ${response.status}`);
  }

  return response.json();
};

/**
 * Get incoming mentorship requests
 */
export const getIncomingRequests = async (
  authHeader: { Authorization: string } | {}
): Promise<MentorshipRequest[]> => {
  const response = await makeAuthRequest(
    '/mentorship/requests/incoming/',
    { method: 'GET' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch incoming requests: ${response.status}`);
  }

  return response.json();
};

/**
 * Get outgoing mentorship requests
 */
export const getOutgoingRequests = async (
  authHeader: { Authorization: string } | {}
): Promise<MentorshipRequest[]> => {
  const response = await makeAuthRequest(
    '/mentorship/requests/outgoing/',
    { method: 'GET' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch outgoing requests: ${response.status}`);
  }

  return response.json();
};

/**
 * Respond to a mentorship request (approve or reject)
 */
export const respondToMentorshipRequest = async (
  payload: RespondToMentorshipRequestPayload,
  authHeader: { Authorization: string } | {}
): Promise<MentorshipRequest> => {
  const { request_id, action } = payload;
  const response = await makeAuthRequest(
    `/mentorship/requests/${request_id}/${action}/`,
    { method: 'POST' },
    authHeader
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to ${action} request: ${response.status}`);
  }

  return response.json();
};

/**
 * Cancel a sent mentorship request
 */
export const cancelMentorshipRequest = async (
  requestId: number,
  authHeader: { Authorization: string } | {}
): Promise<void> => {
  const response = await makeAuthRequest(
    `/mentorship/requests/${requestId}/cancel/`,
    { method: 'POST' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to cancel request: ${response.status}`);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 👥 MENTOR-MENTEE RELATIONSHIPS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get all mentors of the current user
 */
export const getMyMentors = async (
  authHeader: { Authorization: string } | {}
): Promise<MentorshipRelationship[]> => {
  const response = await makeAuthRequest(
    '/mentorship/my-mentors/',
    { method: 'GET' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch mentors: ${response.status}`);
  }

  return response.json();
};

/**
 * Get all mentees of the current user
 */
export const getMyMentees = async (
  authHeader: { Authorization: string } | {}
): Promise<MentorshipRelationship[]> => {
  const response = await makeAuthRequest(
    '/mentorship/my-mentees/',
    { method: 'GET' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch mentees: ${response.status}`);
  }

  return response.json();
};

/**
 * End a mentorship relationship
 */
export const endMentorship = async (
  relationshipId: number,
  authHeader: { Authorization: string } | {}
): Promise<void> => {
  const response = await makeAuthRequest(
    `/mentorship/relationships/${relationshipId}/end/`,
    { method: 'POST' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to end mentorship: ${response.status}`);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// 🎯 MENTEE GOAL MANAGEMENT (MENTOR PERMISSIONS)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Get all goals for a specific mentee (mentor only)
 */
export const getMenteeGoals = async (
  menteeId: number,
  authHeader: { Authorization: string } | {}
): Promise<MenteeGoal[]> => {
  const response = await makeAuthRequest(
    `/mentorship/mentees/${menteeId}/goals/`,
    { method: 'GET' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch mentee goals: ${response.status}`);
  }

  return response.json();
};

/**
 * Create a goal for a mentee (mentor only)
 */
export const createMenteeGoal = async (
  payload: CreateMenteeGoalPayload,
  authHeader: { Authorization: string } | {}
): Promise<MenteeGoal> => {
  const response = await makeAuthRequest(
    '/mentorship/mentee-goals/',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    authHeader
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Failed to create goal: ${response.status}`);
  }

  return response.json();
};

/**
 * Update a mentee's goal (mentor only)
 */
export const updateMenteeGoal = async (
  goalId: number,
  payload: Partial<CreateMenteeGoalPayload>,
  authHeader: { Authorization: string } | {}
): Promise<MenteeGoal> => {
  const response = await makeAuthRequest(
    `/mentorship/mentee-goals/${goalId}/`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to update goal: ${response.status}`);
  }

  return response.json();
};

/**
 * Delete a mentee's goal (mentor only)
 */
export const deleteMenteeGoal = async (
  goalId: number,
  authHeader: { Authorization: string } | {}
): Promise<void> => {
  const response = await makeAuthRequest(
    `/mentorship/mentee-goals/${goalId}/`,
    { method: 'DELETE' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to delete goal: ${response.status}`);
  }
};

/**
 * Provide feedback on a mentee's goal progress (mentor only)
 */
export const provideFeedback = async (
  payload: ProvideFeedbackPayload,
  authHeader: { Authorization: string } | {}
): Promise<MenteeGoal> => {
  const { goal_id, feedback } = payload;
  const response = await makeAuthRequest(
    `/mentorship/mentee-goals/${goal_id}/feedback/`,
    {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to provide feedback: ${response.status}`);
  }

  return response.json();
};

/**
 * Track mentee's progress on a goal (mentor only)
 */
export const trackMenteeProgress = async (
  goalId: number,
  authHeader: { Authorization: string } | {}
): Promise<{ goal: MenteeGoal; progress_history: any[] }> => {
  const response = await makeAuthRequest(
    `/mentorship/mentee-goals/${goalId}/progress/`,
    { method: 'GET' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to track progress: ${response.status}`);
  }

  return response.json();
};

// ────────────────────────────────────────────────────────────────────────────
// ⚙️ PROFILE VISIBILITY SETTINGS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Update profile visibility settings
 */
export const updateProfileVisibility = async (
  payload: UpdateProfileVisibilityPayload,
  authHeader: { Authorization: string } | {}
): Promise<void> => {
  const response = await makeAuthRequest(
    '/profile/visibility/',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to update visibility: ${response.status}`);
  }
};

/**
 * Get current profile visibility settings
 */
export const getProfileVisibility = async (
  authHeader: { Authorization: string } | {}
): Promise<{ visibility: string }> => {
  const response = await makeAuthRequest(
    '/profile/visibility/',
    { method: 'GET' },
    authHeader
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch visibility: ${response.status}`);
  }

  return response.json();
};
