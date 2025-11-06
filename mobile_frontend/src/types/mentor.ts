/**
 * Type definitions for the Mentor-Mentee system
 * 
 * This file contains all TypeScript types related to mentor-mentee relationships,
 * mentor profiles, and mentor-related API responses.
 */

/**
 * Status of a mentor-mentee relationship request
 */
export type MentorshipRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

/**
 * Type of mentorship request
 */
export type MentorshipRequestType = 'MENTOR_REQUEST' | 'MENTEE_REQUEST';

/**
 * Represents a mentor-mentee relationship request
 */
export interface MentorshipRequest {
  id: number;
  from_user: {
    id: number;
    username: string;
    name?: string;
    surname?: string;
    profile_picture?: string;
  };
  to_user: {
    id: number;
    username: string;
    name?: string;
    surname?: string;
    profile_picture?: string;
  };
  request_type: MentorshipRequestType;
  status: MentorshipRequestStatus;
  message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Represents an active mentor-mentee relationship
 */
export interface MentorshipRelationship {
  id: number;
  mentor: {
    id: number;
    username: string;
    name?: string;
    surname?: string;
    bio?: string;
    profile_picture?: string;
  };
  mentee: {
    id: number;
    username: string;
    name?: string;
    surname?: string;
    bio?: string;
    profile_picture?: string;
  };
  established_at: string;
  goals_count?: number;
  active_goals_count?: number;
}

/**
 * Mentor profile with additional statistics
 */
export interface MentorProfile {
  id: number;
  username: string;
  name?: string;
  surname?: string;
  bio?: string;
  location?: string;
  profile_picture?: string;
  user_type?: 'normal' | 'coach' | 'mentor';
  mentee_count?: number;
  specialization?: string[];
  rating?: number;
  experience_years?: number;
}

/**
 * Goal assigned by mentor to mentee
 */
export interface MenteeGoal {
  id: number;
  title: string;
  description: string;
  mentee: {
    id: number;
    username: string;
    name?: string;
    surname?: string;
  };
  mentor: {
    id: number;
    username: string;
    name?: string;
    surname?: string;
  };
  goal_type: 'WALKING_RUNNING' | 'WORKOUT' | 'CYCLING' | 'SPORTS' | 'SWIMMING';
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: 'ACTIVE' | 'COMPLETED' | 'RESTARTED';
  last_updated: string;
  feedback?: string;
}

/**
 * Request payload for creating a mentorship request
 */
export interface CreateMentorshipRequestPayload {
  to_user_id: number;
  request_type: MentorshipRequestType;
  message?: string;
}

/**
 * Request payload for responding to a mentorship request
 */
export interface RespondToMentorshipRequestPayload {
  request_id: number;
  action: 'approve' | 'reject';
}

/**
 * Request payload for creating a goal for a mentee
 */
export interface CreateMenteeGoalPayload {
  mentee_id: number;
  title: string;
  description?: string;
  goal_type: 'WALKING_RUNNING' | 'WORKOUT' | 'CYCLING' | 'SPORTS' | 'SWIMMING';
  target_value: number;
  unit: string;
  target_date: string;
}

/**
 * Request payload for providing feedback on a mentee's goal
 */
export interface ProvideFeedbackPayload {
  goal_id: number;
  feedback: string;
}

/**
 * Search filters for finding mentors
 */
export interface MentorSearchFilters {
  search?: string;
  location?: string;
  specialization?: string;
  min_rating?: number;
  user_type?: 'mentor' | 'coach';
}

/**
 * Visibility settings for user profile
 */
export type ProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY' | 'MENTORS_ONLY';

/**
 * Profile visibility settings update payload
 */
export interface UpdateProfileVisibilityPayload {
  visibility: ProfileVisibility;
}
