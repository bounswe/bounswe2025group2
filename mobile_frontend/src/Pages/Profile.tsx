import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform, Pressable } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  IconButton,
  Modal,
  Portal,
  ProgressBar,
  Surface,
  Text,
  TextInput,
  useTheme,
  MD3Colors,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import Cookies from '@react-native-cookies/cookies';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from '@constants/api';
import { useGoals, FitnessGoal } from '../services/goalApi';
import GoalFormModal from '../components/goals/GoalFormModal';
import GoalDetailModal from '../components/goals/GoalDetailModal';

interface ProfileDetailsResponse {
  username: string;
  name: string;
  surname: string;
  bio: string;
  location: string;
  birth_date: string;
  age: number | string;
  is_coach?: boolean;
}

interface Goal {
  id: number;
  title: string;
  description: string;
  user: number;
  mentor: number | null;
  goal_type: string;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  target_date: string;
  status: string;
  last_updated: string;
}

interface MentorRelationship {
  id: number;
  mentor: number;
  mentee: number;
  status: string;
  sender: number;
  receiver: number;
  mentor_username: string;
  mentee_username: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  is_coach?: boolean;
  user_type?: string;
  current_streak?: number;
  longest_streak?: number;
  last_login_date?: string;
  total_login_days?: number;
}

interface LoginStats {
  current_streak: number;
  longest_streak: number;
  total_login_days: number;
  last_login_date: string | null;
  streak_active: boolean;
  days_until_break: number | null;
  login_calendar: Array<{ date: string; logged_in: boolean }>;
  logged_in_today: boolean;
}


const Profile = () => {
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { getAuthHeader } = useAuth();
  const queryClient = useQueryClient();
  
  // @ts-ignore
  const otherUsername = route.params?.username;

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    surname: '',
    bio: '',
    location: '',
    birth_date: '',
  });
  
  const [isGoalDetailOpen, setIsGoalDetailOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pictureRefreshKey, setPictureRefreshKey] = useState(Date.now());
  
  // Goals state
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FitnessGoal | null>(null);
  const [selectedGoalForDetail, setSelectedGoalForDetail] = useState<FitnessGoal | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  
  // Collapsible sections state
  const [isMentorshipExpanded, setIsMentorshipExpanded] = useState(true);

  // Toast helper functions
  const showSuccessToast = (message: string) => {
    Toast.show({ type: 'success', text1: message });
  };
  
  const showErrorToast = (message: string) => {
    Toast.show({ type: 'error', text1: 'Error', text2: message });
  };

  // Extract origin for Referer header (same pattern as Login.tsx)
  const origin = API_URL.replace(/\/api\/?$/, '');

  const getSanitizedAuthHeader = (): Record<string, string> => {
    const header = getAuthHeader() as { Authorization?: string };
    const authValue = header?.Authorization;
    if (authValue && authValue.trim().length > 0) {
      return { Authorization: authValue };
    }
    return {};
  };

  // Fetch current user (like web version does)
  const { data: me } = useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}user/`, {
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.status === 401 || response.status === 403) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }
      
      return response.json();
    },
    staleTime: 5 * 60_000, // 5 minutes like web
    retry: false,
  });

  // Fetch user details from /users/ endpoint to get is_coach info
  const { data: userDetails } = useQuery<User | null>({
    queryKey: ['userDetails', otherUsername || me?.username],
    queryFn: async () => {
      const response = await fetch(`${API_URL}users/`, {
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.error('Failed to fetch users list for coach info');
        return null;
      }
      
      const allUsers: User[] = await response.json();
      const targetUsername = otherUsername || me?.username;
      const foundUser = allUsers.find(u => u.username === targetUsername);
      
      // Compute is_coach from user_type if not present
      if (foundUser && !foundUser.is_coach && foundUser.user_type) {
        foundUser.is_coach = foundUser.user_type === 'Coach';
      }
      
      console.log('Found user with coach info:', foundUser);
      return foundUser || null;
    },
    enabled: !!(me?.username || otherUsername),
    staleTime: 5 * 60_000,
  });

  // Fetch profile details
  const { data: profileDetails, isLoading: isLoadingProfile } = useQuery<ProfileDetailsResponse>({
    queryKey: ['profile', otherUsername || 'me'],
    queryFn: async () => {
      const endpoint = otherUsername ? `profile/other/${otherUsername}/` : 'profile/';
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const profileData = await response.json();
      
      // Merge is_coach from userDetails if available
      if (userDetails?.is_coach !== undefined) {
        profileData.is_coach = userDetails.is_coach;
      }
      
      console.log('Profile data with coach status:', profileData);
      return profileData;
    },
    enabled: !!userDetails || isLoadingProfile === false,
  });

  // Fetch profile picture
  const { data: profilePictureUri } = useQuery<string>({
    queryKey: ['profilePicture', otherUsername || 'me', pictureRefreshKey],
    queryFn: async () => {
      const endpoint = otherUsername 
        ? `profile/other/picture/${otherUsername}/` 
        : 'profile/picture/';
      
      // Add cache-busting timestamp to the URL
      const cacheBuster = `?t=${Date.now()}`;
      
      const response = await fetch(`${API_URL}${endpoint}${cacheBuster}`, {
        headers: {
          ...getSanitizedAuthHeader(),
        },
        credentials: 'include',
      });
      
      if (!response.ok) return '';
      
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.startsWith('image/')) {
        return `${API_URL}${endpoint}${cacheBuster}`;
      } 
      
      if (contentType.includes('application/json')) {
        const data = await response.json();
        return data.image || '';
      }
      
      return '';
    },
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch mentor-mentee relationships
  const { data: relationships = [] } = useQuery<MentorRelationship[]>({
    queryKey: ['mentor-relationships', 'me'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}mentor-relationships/user/`, {
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch relationships');
      return response.json();
    },
    enabled: !!me,
    staleTime: 60_000,
  });

  // Fetch users list to get user IDs
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}users/`, {
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: !!otherUsername,
    staleTime: 5 * 60_000,
  });

  // Calculate relationship states
  const otherUserId = otherUsername ? (users.find(u => u.username === otherUsername)?.id ?? null) : null;
  // Use me.id directly from the /api/user/ endpoint (like web version)
  const myUserId = me?.id ?? null;
  
  useEffect(() => {
    console.log('Mentor relationship context', {
      me,
      myUserId,
      otherUsername,
      otherUserId,
    });
  }, [me, myUserId, otherUsername, otherUserId]);

  // Invalidate and refetch relationships when navigating to different user's profile
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['mentor-relationships', 'me'] });
  }, [otherUsername, queryClient]);

  // Poll current user and relationships every 1 second to detect login changes
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Refetch current user and relationships
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['mentor-relationships', 'me'] });
    }, 1000); // 1 second

    return () => clearInterval(intervalId);
  }, [queryClient]);

  const relatedRels = useMemo(() => {
    if (!myUserId || !otherUserId) return [];
    return relationships.filter((r: MentorRelationship) => (
      (r.mentor === myUserId && r.mentee === otherUserId) ||
      (r.mentor === otherUserId && r.mentee === myUserId)
    ));
  }, [myUserId, otherUserId, relationships]);

  const selectedRel = relatedRels.find((r: MentorRelationship) => r.status === 'ACCEPTED' && r.mentor === myUserId)
    || relatedRels.find((r: MentorRelationship) => r.status === 'ACCEPTED' && r.mentee === myUserId)
    || relatedRels.find((r: MentorRelationship) => r.status === 'PENDING' && r.receiver === myUserId)
    || relatedRels.find((r: MentorRelationship) => r.status === 'PENDING' && r.sender === myUserId)
    || undefined;

  const isSender = !!(selectedRel && selectedRel.sender === myUserId);
  const isReceiver = !!(selectedRel && selectedRel.receiver === myUserId);
  const isMentorOfOther = !!(selectedRel && selectedRel.status === 'ACCEPTED' && selectedRel.mentor === myUserId);

  const acceptedRels = relationships.filter((r: MentorRelationship) => r.status === 'ACCEPTED' && r.mentor !== r.mentee);
  const myMentors = myUserId ? acceptedRels.filter((r: MentorRelationship) => r.mentee === myUserId).map((r: MentorRelationship) => ({ id: r.mentor, username: r.mentor_username })) : [];
  const myMentees = myUserId ? acceptedRels.filter((r: MentorRelationship) => r.mentor === myUserId).map((r: MentorRelationship) => ({ id: r.mentee, username: r.mentee_username })) : [];
  const myPendingRequests = myUserId ? relationships.filter((r: MentorRelationship) => r.status === 'PENDING' && (r.sender === myUserId || r.receiver === myUserId) && r.mentor !== r.mentee) : [];
  const mentorshipUsernames = Array.from(new Set([...myMentors, ...myMentees].map(u => u.username))).filter(Boolean);

  // Fetch profile pictures for mentors and mentees
  const { data: mentorshipPictures = {} } = useQuery<Record<string, string>>({
    queryKey: ['mentorshipPictures', mentorshipUsernames.join(',')],
    queryFn: async () => {
      const entries: Record<string, string> = {};
      for (const uname of mentorshipUsernames) {
        try {
          const endpoint = `profile/other/picture/${uname}/`;
          const cacheBuster = `?t=${Date.now()}`;
          const response = await fetch(`${API_URL}${endpoint}${cacheBuster}`, {
            headers: {
              ...getSanitizedAuthHeader(),
            },
            credentials: 'include',
          });
          
          if (!response.ok) continue;
          const contentType = response.headers.get('Content-Type') || '';
          if (contentType.startsWith('image/')) {
            entries[uname] = `${API_URL}${endpoint}${cacheBuster}`;
          }
        } catch (e) {
          console.warn('Mentorship picture fetch failed', uname, e);
        }
      }
      return entries;
    },
    enabled: !otherUsername && mentorshipUsernames.length > 0,
    staleTime: 5 * 60_000,
  });

  // Fetch login stats for own profile
  const { data: loginStats } = useQuery<LoginStats>({
    queryKey: ['loginStats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}user/login-stats/`, {
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch login stats');
      return response.json();
    },
    enabled: !otherUsername && !!me,
    staleTime: 60_000, // 1 minute
  });

  // Fetch goals - using the custom hook
  const { data: goals = [], isLoading: isLoadingGoals } = useGoals(otherUsername);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: typeof editedProfile) => {
      try {
        // Filter out empty string values - only send fields with actual data
        const filteredPayload = Object.entries(payload).reduce((acc, [key, value]) => {
          if (value !== '') {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, string>);
        
        console.log('Updating profile with payload:', filteredPayload);
        console.log('API_URL:', API_URL);
        console.log('Origin:', origin);
        
        const cookies = await Cookies.get(API_URL);
        const csrfToken = cookies.csrftoken?.value;
        console.log('CSRF token:', csrfToken ? 'Present' : 'Missing');
        
        const response = await fetch(`${API_URL}profile/`, {
          method: 'PUT',
          headers: {
            ...getSanitizedAuthHeader(),
            'Content-Type': 'application/json',
            'Referer': origin,
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(filteredPayload),
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorData: any = {};
          
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const text = await response.text();
            console.error('Non-JSON error response:', text.substring(0, 500));
          }
          
          console.error('Update profile error details:', errorData);
          
          // Show more specific error messages
          if (errorData.detail) {
            throw new Error(errorData.detail);
          } else if (errorData.name || errorData.surname || errorData.bio || errorData.location || errorData.birth_date) {
            // Field-specific errors
            const fieldErrors = Object.entries(errorData)
              .map(([field, errors]: [string, any]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('\n');
            throw new Error(`Validation errors:\n${fieldErrors}`);
          } else {
            throw new Error(`Failed to update profile: ${response.status}`);
          }
        }
        
        return response.json();
      } catch (error) {
        console.error('Update profile error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      setIsEditing(false);
      showSuccessToast('Profile updated successfully');
    },
    onError: (error: Error) => {
      showErrorToast(error.message || 'Failed to update profile');
    },
  });

  // Upload picture mutation
  const uploadPictureMutation = useMutation({
    mutationFn: async (uri: string) => {
      try {
        const cookies = await Cookies.get(API_URL);
        const csrfToken = cookies.csrftoken?.value;
        
        const formData = new FormData();
        formData.append('profile_picture', {
          uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);
        
        const response = await fetch(`${API_URL}profile/picture/upload/`, {
          method: 'POST',
          headers: {
            ...getSanitizedAuthHeader(),
            'Referer': origin,
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Upload picture error details:', errorData);
          throw new Error(errorData.detail || 'Failed to upload picture');
        }
        
        return response.json();
      } catch (error) {
        console.error('Upload picture error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setPictureRefreshKey(Date.now());
      showSuccessToast('Profile picture updated');
    },
    onError: (error: Error) => {
      showErrorToast(error.message || 'Failed to upload picture');
    },
  });

  // Delete picture mutation
  const deletePictureMutation = useMutation({
    mutationFn: async () => {
      try {
        const cookies = await Cookies.get(API_URL);
        const csrfToken = cookies.csrftoken?.value;
        
        const response = await fetch(`${API_URL}profile/picture/delete/`, {
          method: 'DELETE',
          headers: {
            ...getSanitizedAuthHeader(),
            'Referer': origin,
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Delete picture error details:', errorData);
          throw new Error(errorData.detail || 'Failed to delete picture');
        }
        
        return response.json();
      } catch (error) {
        console.error('Delete picture error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      setPictureRefreshKey(Date.now());
      showSuccessToast('Profile picture deleted');
    },
    onError: (error: Error) => {
      showErrorToast(error.message || 'Failed to delete picture');
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      try {
        const cookies = await Cookies.get(API_URL);
        const csrfToken = cookies.csrftoken?.value;
        
        const response = await fetch(`${API_URL}goals/${goalId}/`, {
          method: 'DELETE',
          headers: {
            ...getSanitizedAuthHeader(),
            'Referer': origin,
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Delete goal error details:', errorData);
          throw new Error(errorData.detail || 'Failed to delete goal');
        }
      } catch (error) {
        console.error('Delete goal error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', 'me'] });
      closeGoalDetails();
      showSuccessToast('Goal deleted successfully');
    },
    onError: (error: Error) => {
      showErrorToast(error.message || 'Failed to delete goal');
    },
  });

  // Request as mentor mutation
  const requestAsMentor = useMutation({
    mutationFn: async () => {
      console.log('requestAsMentor called with:', {
        me,
        otherUserId,
        otherUsername,
        usersCount: users.length,
        checkUser: users.find(u => u.username === otherUsername),
      });

      if (!me) {
        throw new Error('You must be logged in');
      }
      
      if (!otherUserId) {
        throw new Error('Unable to identify the user. Please refresh and try again.');
      }

      // Prevent sending request to self
      if (me.id === otherUserId) {
        console.error('Self-request detected:', { meId: me.id, otherUserId, comparison: me.id === otherUserId });
        throw new Error('You cannot send a mentor request to yourself');
      }

      console.log('Sending mentor request', { mentor: me.id, mentee: otherUserId });

      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      
      const response = await fetch(`${API_URL}mentor-relationships/`, {
        method: 'POST',
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
          'Referer': origin,
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ mentor: me.id, mentee: otherUserId }),
      });

      const rawText = await response.text();

      if (!response.ok) {
        console.error('Mentor request failed', {
          status: response.status,
          statusText: response.statusText,
          bodyPreview: rawText.slice(0, 500),
          payload: { mentor: me.id, mentee: otherUserId },
        });

        try {
          const errorJson = JSON.parse(rawText);
          throw new Error(errorJson.detail || 'Failed to send mentor request');
        } catch {
          throw new Error(`Server error (${response.status})`);
        }
      }

      try {
        return JSON.parse(rawText);
      } catch {
        console.error('Unexpected mentor request response', rawText.slice(0, 200));
        throw new Error('Unexpected response format from server');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-relationships', 'me'] });
      showSuccessToast('Mentor request sent');
    },
    onError: (error: Error) => {
      console.error('Request as mentor error:', error);
      showErrorToast(error.message);
    },
  });

  // Request as mentee mutation
  const requestAsMentee = useMutation({
    mutationFn: async () => {
      if (!me) {
        throw new Error('You must be logged in');
      }
      
      if (!otherUserId) {
        throw new Error('Unable to identify the user. Please refresh and try again.');
      }

      // Prevent sending request to self
      if (me.id === otherUserId) {
        throw new Error('You cannot send a mentor request to yourself');
      }

      console.log('Sending mentee request', { mentor: otherUserId, mentee: me.id });

      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      
      const response = await fetch(`${API_URL}mentor-relationships/`, {
        method: 'POST',
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
          'Referer': origin,
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ mentor: otherUserId, mentee: me.id }),
      });

      const rawText = await response.text();

      if (!response.ok) {
        console.error('Mentee request failed', {
          status: response.status,
          statusText: response.statusText,
          bodyPreview: rawText.slice(0, 500),
          payload: { mentor: otherUserId, mentee: me.id },
        });

        try {
          const errorJson = JSON.parse(rawText);
          throw new Error(errorJson.detail || 'Failed to send mentor request');
        } catch {
          throw new Error(`Server error (${response.status})`);
        }
      }

      try {
        return JSON.parse(rawText);
      } catch {
        console.error('Unexpected mentee request response', rawText.slice(0, 200));
        throw new Error('Unexpected response format from server');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-relationships', 'me'] });
      showSuccessToast('Mentor request sent');
    },
    onError: (error: Error) => {
      console.error('Request as mentee error:', error);
      showErrorToast(error.message);
    },
  });

  // Change relationship status mutation
  const changeRelationshipStatus = useMutation({
    mutationFn: async ({ relationshipId, status }: { relationshipId: number; status: string }) => {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      
      const response = await fetch(`${API_URL}mentor-relationships/${relationshipId}/status/`, {
        method: 'POST',
        headers: {
          ...getSanitizedAuthHeader(),
          'Content-Type': 'application/json',
          'Referer': origin,
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update relationship');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentor-relationships', 'me'] });
      const statusMessages: Record<string, string> = {
        ACCEPTED: 'Request accepted',
        REJECTED: 'Request rejected',
        TERMINATED: 'Relationship terminated',
      };
      showSuccessToast(statusMessages[variables.status] || 'Relationship updated');
    },
    onError: (error: Error) => {
      showErrorToast(error.message);
    },
  });

  // Handlers
  const handleChoosePhoto = async () => {
    const result = await launchImageLibrary({ 
      mediaType: 'photo', 
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    });
    
    if (!result.didCancel && result.assets && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (uri) {
        uploadPictureMutation.mutate(uri);
      }
    }
  };

  const handleDeletePhoto = () => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: () => deletePictureMutation.mutate(), style: 'destructive' },
      ],
    );
  };

  const onSave = () => {
    updateProfileMutation.mutate(editedProfile);
  };

  const openGoalDetails = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsGoalDetailOpen(true);
  };

  const closeGoalDetails = () => {
    setIsGoalDetailOpen(false);
    setSelectedGoal(null);
  };

  const handleDeleteSelectedGoal = () => {
    if (!selectedGoal) return;
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          onPress: () => deleteGoalMutation.mutate(selectedGoal.id),
          style: 'destructive' 
        },
      ],
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'dismissed') {
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
      return;
    }
    
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      setEditedProfile({ ...editedProfile, birth_date: formattedDate });
    }
  };

  const parseBirthDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Update local state when profile data is fetched
  useEffect(() => {
    if (profileDetails) {
      setEditedProfile({
        name: profileDetails.name || '',
        surname: profileDetails.surname || '',
        bio: profileDetails.bio || '',
        location: profileDetails.location || '',
        birth_date: profileDetails.birth_date || '',
      });
    }
  }, [profileDetails]);
  
  if (isLoadingProfile) {
    return (
      <View style={[styles.container, styles.loader, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating={true} size="large" testID="activity-indicator" />
      </View>
    );
  }

  const avatarInitial = profileDetails?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Profile Hero Section */}
        <Card mode="elevated" style={styles.heroCard}>
          <Card.Content style={styles.heroContent}>
            {/* Avatar with action overlay */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {profilePictureUri ? (
                  <Avatar.Image
                    size={140}
                    source={{ 
                      uri: profilePictureUri,
                      headers: getAuthHeader(),
                    }}
                    key={pictureRefreshKey}
                  />
                ) : (
                  <Avatar.Text 
                    size={140} 
                    label={avatarInitial}
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    labelStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 48 }}
                  />
                )}
                {/* Photo action buttons overlay */}
                {!otherUsername && (
                  <View style={[styles.avatarOverlay, { backgroundColor: theme.colors.surface }]}>
                    <IconButton 
                      icon="camera" 
                      size={18} 
                      onPress={handleChoosePhoto}
                      mode="contained"
                      containerColor={theme.colors.primary}
                      iconColor={theme.colors.onPrimary}
                      disabled={uploadPictureMutation.isPending}
                      testID="camera-button"
                      style={styles.avatarActionButton}
                    />
                    {profilePictureUri && (
                      <IconButton 
                        icon="delete-outline" 
                        size={18} 
                        onPress={handleDeletePhoto}
                        mode="contained"
                        containerColor={theme.colors.errorContainer}
                        iconColor={theme.colors.onErrorContainer}
                        disabled={deletePictureMutation.isPending}
                        testID="delete-picture-button"
                        style={styles.avatarActionButton}
                      />
                    )}
                  </View>
                )}
              </View>
            </View>
            
            {/* Name and info section */}
            <View style={styles.profileInfoSection}>
              <Text variant="headlineSmall" style={[styles.displayName, { color: theme.colors.onSurface }]}>
                {profileDetails?.name && profileDetails?.surname 
                  ? `${profileDetails.name} ${profileDetails.surname}` 
                  : profileDetails?.username}
              </Text>
              <Text variant="bodyLarge" style={[styles.username, { color: theme.colors.onSurfaceVariant }]}>
                @{profileDetails?.username}
              </Text>
              {(userDetails?.is_coach || profileDetails?.is_coach) && (
                <Chip 
                  mode="flat" 
                  compact 
                  icon="school"
                  style={[styles.coachBadge, { backgroundColor: theme.colors.tertiaryContainer }]}
                  textStyle={{ color: theme.colors.onTertiaryContainer, fontSize: 12, fontWeight: '600' }}
                >
                  Coach
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Login Streak Section - Only show for own profile */}
        {!otherUsername && loginStats && (
          <Card mode="elevated" style={styles.sectionCard}>
            <Card.Content style={styles.streakCompactContainer}>
              {/* Three stats in a row */}
              <View style={styles.streakCompactRow}>
                <View style={styles.streakCompactStat}>
                  <Avatar.Icon 
                    size={32} 
                    icon="fire" 
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.onPrimaryContainer}
                  />
                  <Text variant="titleMedium" style={{ fontWeight: '700', color: theme.colors.primary }}>
                    {loginStats.current_streak}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Current</Text>
                </View>
                
                <View style={styles.streakCompactStat}>
                  <Avatar.Icon 
                    size={32} 
                    icon="trophy" 
                    style={{ backgroundColor: theme.colors.tertiaryContainer }}
                    color={theme.colors.onTertiaryContainer}
                  />
                  <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                    {loginStats.longest_streak}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Best</Text>
                </View>
                
                <View style={styles.streakCompactStat}>
                  <Avatar.Icon 
                    size={32} 
                    icon="calendar-check" 
                    style={{ backgroundColor: theme.colors.secondaryContainer }}
                    color={theme.colors.onSecondaryContainer}
                  />
                  <Text variant="titleMedium" style={{ fontWeight: '700' }}>
                    {loginStats.total_login_days}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Total</Text>
                </View>
              </View>
              
              {/* Status message */}
              <View style={styles.streakStatusRow}>
                {loginStats.streak_active ? (
                  <Chip 
                    mode="flat" 
                    compact
                    icon={loginStats.logged_in_today ? "fire" : "alert"}
                    style={{ backgroundColor: loginStats.logged_in_today ? theme.colors.tertiaryContainer : theme.colors.secondaryContainer }}
                    textStyle={{ fontSize: 11 }}
                  >
                    {loginStats.logged_in_today 
                      ? 'Logged in today! 🔥' 
                      : loginStats.days_until_break === 0 
                        ? 'Login today to keep streak!'
                        : 'Streak active'}
                  </Chip>
                ) : (
                  <Chip 
                    mode="flat" 
                    compact
                    icon="alert-circle"
                    style={{ backgroundColor: theme.colors.errorContainer }}
                    textStyle={{ color: theme.colors.onErrorContainer, fontSize: 11 }}
                  >
                    Streak inactive
                  </Chip>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Profile Information Section */}
        <Card mode="elevated" style={styles.sectionCard}>
          <Card.Title
            title="Profile Information"
            right={(props) => !otherUsername && !isEditing ? (
              <Button {...props} icon="pencil" onPress={() => setIsEditing(true)}>Edit</Button>
            ) : null}
          />
          <Card.Content>
            {isEditing ? (
              <View>
                <TextInput label="Name" value={editedProfile.name} onChangeText={(text) => setEditedProfile({...editedProfile, name: text})} style={styles.input} mode="outlined" />
                <TextInput label="Surname" value={editedProfile.surname} onChangeText={(text) => setEditedProfile({...editedProfile, surname: text})} style={styles.input} mode="outlined" />
                <TextInput label="Location" value={editedProfile.location} onChangeText={(text) => setEditedProfile({...editedProfile, location: text})} style={styles.input} mode="outlined" />
                <TextInput label="Bio" value={editedProfile.bio} onChangeText={(text) => setEditedProfile({...editedProfile, bio: text})} style={styles.input} multiline mode="outlined" />
                
                <View style={styles.datePickerContainer}>
                  <Text variant="labelLarge" style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>Birth Date</Text>
                  <Button 
                    mode="outlined" 
                    onPress={() => setShowDatePicker(true)}
                    icon="calendar"
                    style={styles.dateButton}
                    contentStyle={styles.dateButtonContent}
                  >
                    {editedProfile.birth_date 
                      ? new Date(editedProfile.birth_date).toLocaleDateString()
                      : 'Select Date'}
                  </Button>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={parseBirthDate(editedProfile.birth_date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}

                <View style={styles.formActions}>
                  <Button onPress={() => setIsEditing(false)}>Cancel</Button>
                  <Button mode="contained" onPress={onSave} loading={updateProfileMutation.isPending}>Save</Button>
                </View>
              </View>
            ) : (
              <View>
                <InfoRow label="Full Name" value={`${profileDetails?.name || ''} ${profileDetails?.surname || ''}`.trim() || 'Not specified'} />
                <InfoRow label="Location" value={profileDetails?.location || 'Not specified'} />
                <InfoRow label="Age" value={String(profileDetails?.age || 'Not specified')} />
                <InfoRow label="Bio" value={profileDetails?.bio || 'No bio provided.'} isLast />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Goals Section - Show for own profile or when viewing mentee as mentor */}
        {(!otherUsername || (otherUsername && selectedRel && selectedRel.status === 'ACCEPTED' && selectedRel.mentor === myUserId)) && (
          <Card mode="elevated" style={styles.sectionCard}>
            <Card.Title
              title="Goals"
              right={(props) => {
                // Show "New" button for own profile or when viewing mentee as mentor
                const isMentorOfOther = otherUsername && selectedRel && selectedRel.status === 'ACCEPTED' && selectedRel.mentor === myUserId;
                
                if (!otherUsername) {
                  return (
                    <Button {...props} icon="plus" onPress={() => setIsGoalFormOpen(true)}>New</Button>
                  );
                }
                if (isMentorOfOther) {
                  return (
                    <Button {...props} icon="plus" onPress={() => {
                      setEditingGoal(null);
                      setIsGoalFormOpen(true);
                    }}>Add for Mentee</Button>
                  );
                }
                return null;
              }}
            />
            <Card.Content>
              {isLoadingGoals ? <ActivityIndicator/> : goals.length > 0 ? (
                  goals.map((goal: FitnessGoal, index: number) => (
                    <React.Fragment key={goal.id}>
                      <Pressable onPress={() => {
                        setSelectedGoalForDetail(goal);
                        setIsGoalModalOpen(true);
                      }}>
                        <GoalCard 
                          goal={goal} 
                          onPress={() => {
                            setSelectedGoalForDetail(goal);
                            setIsGoalModalOpen(true);
                          }}
                        />
                      </Pressable>
                      {index < goals.length - 1 && <Divider style={styles.goalDivider} />}
                    </React.Fragment>
                  ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Avatar.Icon icon="flag-checkered" size={48} style={{backgroundColor: theme.colors.surfaceVariant}}/>
                  <Text variant="titleMedium" style={styles.emptyStateText}>No Goals Set</Text>
                  <Text variant="bodyMedium" style={styles.emptyStateText}>
                    {otherUsername 
                      ? 'No goals set for this mentee yet. Tap "Add for Mentee" to create one.'
                      : "You haven't set any goals yet."}
                  </Text>
                  {!otherUsername && (
                    <Button mode="contained" style={styles.emptyStateButton} onPress={() => setIsGoalFormOpen(true)}>Set Your First Goal</Button>
                  )}
                  {otherUsername && (
                    <Button mode="contained" style={styles.emptyStateButton} onPress={() => {
                      setEditingGoal(null);
                      setIsGoalFormOpen(true);
                    }}>Add Goal for Mentee</Button>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Mentorship Section - Own Profile */}
        {!otherUsername && (
          <Card mode="elevated" style={styles.sectionCard}>
            <Pressable onPress={() => setIsMentorshipExpanded(!isMentorshipExpanded)}>
              <Card.Title 
                title="Mentorship" 
                right={(props) => (
                  <IconButton 
                    {...props} 
                    icon={isMentorshipExpanded ? 'chevron-up' : 'chevron-down'} 
                    onPress={() => setIsMentorshipExpanded(!isMentorshipExpanded)}
                  />
                )}
              />
            </Pressable>
            {isMentorshipExpanded && (
            <Card.Content>
              {/* My Mentors */}
              <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: '600' }}>Your Mentors</Text>
              {myMentors.length > 0 ? (
                <View style={styles.mentorshipList}>
                  {myMentors.map((u) => (
                    <Pressable 
                      key={`mentor-${u.id}`}
                      onPress={() => {
                        // @ts-ignore
                        navigation.push('Profile', { username: u.username });
                      }}
                      style={{ width: '100%' }}
                    >
                      <Card mode="elevated" style={styles.mentorCard}>
                        <Card.Content style={styles.mentorCardContent}>
                          {mentorshipPictures[u.username] ? (
                            <Avatar.Image size={56} source={{ uri: mentorshipPictures[u.username], headers: getAuthHeader() }} />
                          ) : (
                            <Avatar.Text size={56} label={u.username?.[0]?.toUpperCase() || 'U'} />
                          )}
                          <View style={styles.mentorInfo}>
                            <Text variant="titleMedium" style={styles.mentorName}>{u.username}</Text>
                            <Chip compact mode="flat" icon="school" style={[styles.roleChip, { backgroundColor: theme.colors.primaryContainer }]}>
                              <Text style={{ color: theme.colors.onPrimaryContainer, fontSize: 12 }}>Mentor</Text>
                            </Chip>
                          </View>
                          <IconButton icon="chevron-right" size={24} />
                        </Card.Content>
                      </Card>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Card mode="outlined" style={styles.emptyCard}>
                  <Card.Content>
                    <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.7 }}>
                      You currently have no mentors.
                    </Text>
                  </Card.Content>
                </Card>
              )}

              <Divider style={styles.sectionDivider} />

              {/* My Mentees */}
              <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: '600' }}>Your Mentees</Text>
              {myMentees.length > 0 ? (
                <View style={styles.mentorshipList}>
                  {myMentees.map((u) => (
                    <Pressable 
                      key={`mentee-${u.id}`}
                      onPress={() => {
                        // @ts-ignore
                        navigation.push('Profile', { username: u.username });
                      }}
                      style={{ width: '100%' }}
                    >
                      <Card mode="elevated" style={styles.mentorCard}>
                        <Card.Content style={styles.mentorCardContent}>
                          {mentorshipPictures[u.username] ? (
                            <Avatar.Image size={56} source={{ uri: mentorshipPictures[u.username], headers: getAuthHeader() }} />
                          ) : (
                            <Avatar.Text size={56} label={u.username?.[0]?.toUpperCase() || 'U'} />
                          )}
                          <View style={styles.mentorInfo}>
                            <Text variant="titleMedium" style={styles.mentorName}>{u.username}</Text>
                            <Chip compact mode="flat" icon="account" style={[styles.roleChip, { backgroundColor: theme.colors.secondaryContainer }]}>
                              <Text style={{ color: theme.colors.onSecondaryContainer, fontSize: 12 }}>Mentee</Text>
                            </Chip>
                          </View>
                          <IconButton icon="chevron-right" size={24} />
                        </Card.Content>
                      </Card>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Card mode="outlined" style={styles.emptyCard}>
                  <Card.Content>
                    <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.7 }}>
                      You currently have no mentees.
                    </Text>
                  </Card.Content>
                </Card>
              )}

              <Divider style={styles.sectionDivider} />

              {/* Pending Requests */}
              <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: '600' }}>Pending Requests</Text>
              {myPendingRequests.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {myPendingRequests.map((r) => {
                    const amReceiver = r.receiver === myUserId;
                    const amMentor = r.mentor === myUserId;
                    const otherUsernameLabel = amMentor ? r.mentee_username : r.mentor_username;
                    const roleWord = amMentor ? 'mentee' : 'mentor';
                    const sentence = amReceiver
                      ? `${otherUsernameLabel} asked to be your ${roleWord}`
                      : `You asked ${otherUsernameLabel} to be your ${roleWord}`;
                    
                    return (
                      <Card key={`pending-${r.id}`} mode="elevated" style={styles.pendingRequestCard}>
                        <Card.Content>
                          <Pressable 
                            onPress={() => {
                              // @ts-ignore
                              navigation.push('Profile', { username: otherUsernameLabel });
                            }}
                            style={styles.pendingRequestHeader}
                          >
                            <Avatar.Text size={40} label={otherUsernameLabel?.[0]?.toUpperCase() || 'U'} />
                            <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 12 }}>{sentence}</Text>
                          </Pressable>
                          <View style={styles.pendingRequestActions}>
                            {amReceiver ? (
                              <>
                                <Button 
                                  mode="contained" 
                                  compact 
                                  onPress={() => changeRelationshipStatus.mutate({ relationshipId: r.id, status: 'ACCEPTED' })}
                                  disabled={changeRelationshipStatus.isPending}
                                  style={{ flex: 1 }}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  mode="outlined" 
                                  compact 
                                  onPress={() => changeRelationshipStatus.mutate({ relationshipId: r.id, status: 'REJECTED' })}
                                  disabled={changeRelationshipStatus.isPending}
                                  style={{ flex: 1 }}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <Button 
                                mode="outlined" 
                                compact 
                                onPress={() => changeRelationshipStatus.mutate({ relationshipId: r.id, status: 'REJECTED' })}
                                disabled={changeRelationshipStatus.isPending}
                                style={{ flex: 1 }}
                              >
                                Cancel Request
                              </Button>
                            )}
                          </View>
                        </Card.Content>
                      </Card>
                    );
                  })}
                </View>
              ) : (
                <Card mode="outlined" style={styles.emptyCard}>
                  <Card.Content>
                    <Text variant="bodyMedium" style={{ textAlign: 'center', opacity: 0.7 }}>
                      You have no pending requests.
                    </Text>
                  </Card.Content>
                </Card>
              )}
            </Card.Content>
            )}
          </Card>
        )}

        {/* Mentorship Section - Other User's Profile */}
        {otherUsername && (
          <Card mode="elevated" style={styles.sectionCard}>
            <Card.Title title="Mentorship" />
            <Card.Content>
              <Surface style={styles.relationshipStatusSurface} elevation={1}>
                <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
                  {selectedRel && selectedRel.status === 'ACCEPTED'
                    ? (selectedRel.mentor === myUserId
                        ? `${otherUsername} is your mentee`
                        : `${otherUsername} is your mentor`)
                    : selectedRel && selectedRel.status === 'PENDING' && isSender
                      ? (selectedRel.mentor === myUserId
                          ? `You have asked ${otherUsername} to be your mentee`
                          : `You have asked ${otherUsername} to be your mentor`)
                      : selectedRel && selectedRel.status === 'PENDING' && isReceiver
                        ? (selectedRel.mentor === otherUserId
                            ? `${otherUsername} has asked to be your mentor`
                            : `${otherUsername} has asked to be your mentee`)
                        : `You and ${otherUsername} are not connected`}
                </Text>
              </Surface>
              <View style={styles.relationshipActions}>
                {selectedRel && selectedRel.status === 'ACCEPTED' && (
                  <Button 
                    mode="outlined" 
                    onPress={() => changeRelationshipStatus.mutate({ relationshipId: selectedRel.id, status: 'TERMINATED' })}
                    disabled={changeRelationshipStatus.isPending}
                    icon="link-variant-off"
                    textColor={theme.colors.error}
                    style={{ borderColor: theme.colors.error }}
                  >
                    End Relationship
                  </Button>
                )}
                {selectedRel && selectedRel.status === 'PENDING' && isSender && (
                  <Button 
                    mode="outlined" 
                    onPress={() => changeRelationshipStatus.mutate({ relationshipId: selectedRel.id, status: 'REJECTED' })}
                    disabled={changeRelationshipStatus.isPending}
                    icon="close"
                  >
                    Cancel Request
                  </Button>
                )}
                {selectedRel && selectedRel.status === 'PENDING' && isReceiver && (
                  <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                    <Button 
                      mode="contained" 
                      onPress={() => changeRelationshipStatus.mutate({ relationshipId: selectedRel.id, status: 'ACCEPTED' })}
                      disabled={changeRelationshipStatus.isPending}
                      icon="check"
                      style={{ flex: 1 }}
                    >
                      Accept
                    </Button>
                    <Button 
                      mode="outlined" 
                      onPress={() => changeRelationshipStatus.mutate({ relationshipId: selectedRel.id, status: 'REJECTED' })}
                      disabled={changeRelationshipStatus.isPending}
                      icon="close"
                      style={{ flex: 1 }}
                    >
                      Reject
                    </Button>
                  </View>
                )}
                {(!selectedRel || (selectedRel && ['REJECTED', 'TERMINATED'].includes(selectedRel.status))) && (
                  <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                    <Button 
                      mode="contained" 
                      onPress={() => requestAsMentor.mutate()}
                      disabled={requestAsMentor.isPending || !me || !otherUserId}
                      icon="account-supervisor"
                      style={{ flex: 1 }}
                    >
                      Be Their Mentor
                    </Button>
                    <Button 
                      mode="contained" 
                      onPress={() => requestAsMentee.mutate()}
                      disabled={requestAsMentee.isPending || !me || !otherUserId}
                      icon="school"
                      style={{ flex: 1 }}
                    >
                      Request as Mentor
                    </Button>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Goal Detail Modal */}
      <Portal>
        <Modal visible={isGoalDetailOpen} onDismiss={closeGoalDetails} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.elevation.level3 }]}>
           <Dialog.Title>{selectedGoal?.title}</Dialog.Title>
           <Dialog.Content>
              <InfoRow label="Status" value={selectedGoal?.status || ''} />
              <InfoRow label="Description" value={selectedGoal?.description || '—'} />
              <InfoRow label="Progress" value={`${selectedGoal?.current_value} / ${selectedGoal?.target_value} ${selectedGoal?.unit}`} />
              <InfoRow label="Target Date" value={selectedGoal?.target_date ? new Date(selectedGoal.target_date).toLocaleDateString() : '—'} isLast />
           </Dialog.Content>
           <Dialog.Actions>
             <Button 
               mode="contained" 
               onPress={() => {
                 closeGoalDetails();
                 // @ts-ignore
                 navigation.navigate('Main', { screen: 'Goals' });
               }}
             >
               View in Goals
             </Button>
             <Button onPress={closeGoalDetails}>Close</Button>
           </Dialog.Actions>
        </Modal>
      </Portal>

      {/* Goal Form Modal */}
      <GoalFormModal
        isVisible={isGoalFormOpen}
        onClose={() => {
          setIsGoalFormOpen(false);
          setEditingGoal(null);
        }}
        editingGoal={editingGoal}
        targetUserId={otherUserId || undefined}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }}
      />

      {/* Goal Detail Modal */}
      <GoalDetailModal
        isVisible={isGoalModalOpen}
        goal={selectedGoalForDetail}
        onClose={() => {
          setIsGoalModalOpen(false);
          setSelectedGoalForDetail(null);
        }}
        isOwner={selectedGoalForDetail?.user === myUserId}
        isMentor={selectedGoalForDetail?.mentor === myUserId}
        onGoalUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['goals'] });
        }}
        onGoalDeleted={() => {
          queryClient.invalidateQueries({ queryKey: ['goals'] });
          setIsGoalModalOpen(false);
          setSelectedGoalForDetail(null);
        }}
      />
    </>
  );
};


// --- Helper Components ---

const InfoRow = ({ label, value, isLast = false }: { label: string, value: string, isLast?: boolean }) => {
  const theme = useTheme();
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text variant="bodyLarge" style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const GoalCard = ({ goal, onPress }: { goal: any, onPress: () => void }) => {
  const theme = useTheme();
  const progress = (goal.current_value / goal.target_value);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { bg: theme.colors.primaryContainer, text: theme.colors.onPrimaryContainer };
      case 'COMPLETED': return { bg: theme.colors.tertiaryContainer, text: theme.colors.onTertiaryContainer };
      case 'INACTIVE': return { bg: theme.colors.surfaceVariant, text: theme.colors.onSurfaceVariant };
      default: return { bg: theme.colors.secondaryContainer, text: theme.colors.onSecondaryContainer };
    }
  };
  
  const statusColors = getStatusColor(goal.status);
  
  return (
    <Card mode="elevated" onPress={onPress} style={styles.goalCard}>
      <Card.Content>
        <View style={styles.goalHeader}>
          <Text variant="titleMedium" style={{ flex: 1 }}>{goal.title}</Text>
          <Chip 
            compact 
            mode="flat"
            style={{ backgroundColor: statusColors.bg }}
            textStyle={{ color: statusColors.text, fontSize: 11 }}
          >
            {goal.status}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={styles.goalDescription}>{goal.description}</Text>
        <View style={styles.progressContainer}>
           <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
           <Text variant="labelSmall">{goal.current_value} / {goal.target_value} {goal.unit}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    margin: 16,
    borderRadius: 24,
  },
  heroContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarSection: {
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  avatarActionButton: {
    margin: 0,
  },
  profileInfoSection: {
    alignItems: 'center',
    gap: 4,
  },
  displayName: {
    fontWeight: '700',
    textAlign: 'center',
  },
  username: {
    textAlign: 'center',
  },
  coachBadge: {
    marginTop: 8,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarActions: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 25,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  avatarActionsBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  heroTextContainer: {
    alignItems: 'center',
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  input: {
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    alignItems: 'center',
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  infoValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
  mentorshipList: {
    gap: 12,
    marginBottom: 16,
  },
  mentorCard: {
    width: '100%',
    marginBottom: 0,
  },
  mentorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  mentorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  mentorName: {
    fontWeight: '600',
  },
  roleChip: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  emptyCard: {
    marginBottom: 16,
  },
  sectionDivider: {
    marginVertical: 16,
  },
  pendingRequestCard: {
    marginBottom: 8,
  },
  pendingRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingRequestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  relationshipStatusSurface: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  relationshipActions: {
    gap: 12,
    alignItems: 'center',
  },
  goalCard: {
    marginBottom: 8,
    borderRadius: 16,
  },
  goalDivider: {
    marginVertical: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalDescription: {
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    textAlign: 'center',
    marginVertical: 4,
  },
  emptyStateButton: {
    marginTop: 16,
  },
  datePickerContainer: {
    marginBottom: 12,
  },
  dateLabel: {
    marginBottom: 8,
  },
  dateButton: {
    justifyContent: 'flex-start',
  },
  dateButtonContent: {
    justifyContent: 'flex-start',
    paddingVertical: 8,
  },
  streakCompactContainer: {
    paddingVertical: 8,
  },
  streakCompactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakCompactStat: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  streakStatusRow: {
    alignItems: 'center',
    marginTop: 12,
  },
});

export default Profile;