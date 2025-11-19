import Cookies from '@react-native-cookies/cookies';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:8000/api';

export interface MentorRelationship {
  id: number;
  sender: number;
  receiver: number;
  mentor: number;
  mentee: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'TERMINATED';
  sender_username: string;
  receiver_username: string;
  mentor_username: string;
  mentee_username: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  user_type: 'ATHLETE' | 'TRAINER';
}

/**
 * Get authentication headers with token from AsyncStorage
 */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log('Using auth token:', headers.Authorization.substring(0, 20) + '...');
    } else {
      console.warn('No auth token found in AsyncStorage');
    }

    return headers;
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return { 'Content-Type': 'application/json' };
  }
};

/**
 * Create a mentor-mentee relationship request
 * @param mentorId - The ID of the user who will be the mentor
 * @param menteeId - The ID of the user who will be the mentee
 * @returns The created relationship object
 */
export const createMentorRelationship = async (
  mentorId: number,
  menteeId: number
): Promise<MentorRelationship> => {
  try {
    const cookies = await Cookies.get(API_BASE_URL);
    const csrfToken = cookies?.csrftoken?.value;
    const authHeaders = await getAuthHeaders();

    console.log('Creating mentor relationship:', { mentorId, menteeId });

    const response = await fetch(`${API_BASE_URL}/mentor-relationships/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...authHeaders,
        'X-CSRFToken': csrfToken || '',
      },
      body: JSON.stringify({
        mentor: mentorId,
        mentee: menteeId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create relationship error:', response.status, errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || error.error || 'Failed to create mentor relationship');
      } catch {
        throw new Error(`Failed to create mentor relationship: ${response.status}`);
      }
    }

    return response.json();
  } catch (error) {
    console.error('createMentorRelationship error:', error);
    throw error;
  }
};

/**
 * Get all mentor relationships for the current user
 * @param filters - Optional filters for status, role, etc.
 * @returns Array of mentor relationships
 */
export const getUserMentorRelationships = async (filters?: {
  status?: string;
  as?: 'sender' | 'receiver';
  role?: 'mentor' | 'mentee';
}): Promise<MentorRelationship[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.as) params.append('as', filters.as);
    if (filters?.role) params.append('role', filters.role);

    const url = `${API_BASE_URL}/mentor-relationships/user/${
      params.toString() ? `?${params.toString()}` : ''
    }`;

    const authHeaders = await getAuthHeaders();

    console.log('Fetching mentor relationships from:', url);
    console.log('Auth headers:', Object.keys(authHeaders));

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: authHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get relationships error:', response.status, errorText);
      throw new Error(`Failed to fetch mentor relationships: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('getUserMentorRelationships error:', error);
    throw error;
  }
};

/**
 * Get details of a specific mentor relationship
 * @param relationshipId - The ID of the relationship
 * @returns The relationship details
 */
export const getMentorRelationshipDetail = async (
  relationshipId: number
): Promise<MentorRelationship> => {
  try {
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/mentor-relationships/${relationshipId}/`,
      {
        method: 'GET',
        credentials: 'include',
        headers: authHeaders,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch relationship details');
    }

    return response.json();
  } catch (error) {
    console.error('getMentorRelationshipDetail error:', error);
    throw error;
  }
};

/**
 * Change the status of a mentor relationship
 * @param relationshipId - The ID of the relationship
 * @param status - The new status (ACCEPTED, REJECTED, or TERMINATED)
 * @returns Success message
 */
export const changeMentorRelationshipStatus = async (
  relationshipId: number,
  status: 'ACCEPTED' | 'REJECTED' | 'TERMINATED'
): Promise<{ message: string }> => {
  try {
    const cookies = await Cookies.get(API_BASE_URL);
    const csrfToken = cookies?.csrftoken?.value;
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${API_BASE_URL}/mentor-relationships/${relationshipId}/status/`,
      {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...authHeaders,
          'X-CSRFToken': csrfToken || '',
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change relationship status');
    }

    return response.json();
  } catch (error) {
    console.error('changeMentorRelationshipStatus error:', error);
    throw error;
  }
};

/**
 * Get all users (for finding potential mentors/mentees)
 * @returns Array of users
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const authHeaders = await getAuthHeaders();

    console.log('Fetching all users from:', `${API_BASE_URL}/users/`);

    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'GET',
      credentials: 'include',
      headers: authHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get users error:', response.status, errorText);
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('getAllUsers error:', error);
    throw error;
  }
};

/**
 * Get the current user's information
 * @returns Current user data
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const authHeaders = await getAuthHeaders();

    console.log('Fetching current user from:', `${API_BASE_URL}/user/`);

    const response = await fetch(`${API_BASE_URL}/user/`, {
      method: 'GET',
      credentials: 'include',
      headers: authHeaders,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Get current user error:', response.status, errorText);
      throw new Error(`Failed to fetch current user: ${response.status}`);
    }

    const userData = await response.json();
    console.log('Current user:', userData);
    return userData;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    throw error;
  }
};
