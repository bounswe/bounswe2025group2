import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform } from 'react-native';
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
  Text,
  TextInput,
  useTheme,
  MD3Colors,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import Cookies from '@react-native-cookies/cookies';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL } from '@constants/api';

interface ProfileDetailsResponse {
  username: string;
  name: string;
  surname: string;
  bio: string;
  location: string;
  birth_date: string;
  age: number | string;
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

  // Fetch profile details
  const { data: profileDetails, isLoading: isLoadingProfile } = useQuery<ProfileDetailsResponse>({
    queryKey: ['profile', otherUsername || 'me'],
    queryFn: async () => {
      const endpoint = otherUsername ? `/profile/other/${otherUsername}/` : '/profile/';
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      return response.json();
    },
  });

  // Fetch profile picture
  const { data: profilePictureUri } = useQuery<string>({
    queryKey: ['profilePicture', otherUsername || 'me', pictureRefreshKey],
    queryFn: async () => {
      const endpoint = otherUsername 
        ? `/profile/other/picture/${otherUsername}/` 
        : '/profile/picture/';
      
      // Add cache-busting timestamp to the URL
      const cacheBuster = `?t=${Date.now()}`;
      
      const response = await fetch(`${API_URL}${endpoint}${cacheBuster}`, {
        headers: {
          ...getAuthHeader(),
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

  // Fetch goals - only for own profile
  const { data: goals = [], isLoading: isLoadingGoals } = useQuery<Goal[]>({
    queryKey: ['goals', otherUsername || 'me'],
    queryFn: async () => {
      // Only fetch goals for own profile
      // Goals are private and only visible to user and their mentor
      // Since we can't determine mentor relationship from frontend, don't show goals for other users
      if (otherUsername) {
        return [];
      }
      
      const response = await fetch(`${API_URL}goals/`, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !otherUsername, // Only run query for own profile
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: typeof editedProfile) => {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      
      const response = await fetch(`${API_URL}profile/`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile');
    },
  });

  // Upload picture mutation
  const uploadPictureMutation = useMutation({
    mutationFn: async (uri: string) => {
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
          ...getAuthHeader(),
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload picture');
      return response.json();
    },
    onSuccess: () => {
      // Update the refresh key to force re-fetch
      setPictureRefreshKey(Date.now());
      Alert.alert('Success', 'Profile picture updated');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to upload picture');
    },
  });

  // Delete picture mutation
  const deletePictureMutation = useMutation({
    mutationFn: async () => {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      
      const response = await fetch(`${API_URL}profile/picture/delete/`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete picture');
      return response.json();
    },
    onSuccess: () => {
      // Update the refresh key to force re-fetch
      setPictureRefreshKey(Date.now());
      Alert.alert('Success', 'Profile picture deleted');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete picture');
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const cookies = await Cookies.get(API_URL);
      const csrfToken = cookies.csrftoken?.value;
      
      const response = await fetch(`${API_URL}goals/${goalId}/`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader(),
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete goal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', 'me'] });
      closeGoalDetails();
      Alert.alert('Success', 'Goal deleted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete goal');
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
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  const avatarInitial = profileDetails?.username?.[0]?.toUpperCase() || '?';

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Profile Hero Section */}
        <Card mode="contained" style={[styles.heroCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content style={styles.heroContent}>
            <View style={styles.avatarWrapper}>
              {profilePictureUri ? (
                <Avatar.Image
                  size={120}
                  source={{ 
                    uri: profilePictureUri,
                    headers: getAuthHeader(),
                  }}
                  key={pictureRefreshKey}
                />
              ) : (
                <Avatar.Text size={120} label={avatarInitial} />
              )}
              {!otherUsername && (
                <View style={styles.avatarActionsBelow}>
                  <IconButton 
                    icon="camera" 
                    size={20} 
                    onPress={handleChoosePhoto}
                    mode="contained-tonal"
                    disabled={uploadPictureMutation.isPending}
                  />
                  {profilePictureUri && (
                    <IconButton 
                      icon="delete" 
                      size={20} 
                      onPress={handleDeletePhoto}
                      mode="contained-tonal"
                      disabled={deletePictureMutation.isPending}
                    />
                  )}
                </View>
              )}
            </View>
            <View style={styles.heroTextContainer}>
              <Text variant="headlineMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                {profileDetails?.name && profileDetails?.surname 
                  ? `${profileDetails.name} ${profileDetails.surname}` 
                  : profileDetails?.username}
              </Text>
              <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                @{profileDetails?.username}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Profile Information Section */}
        <Card style={styles.sectionCard}>
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

        {/* Goals Section - Only show for own profile */}
        {!otherUsername && (
          <Card style={styles.sectionCard}>
            <Card.Title
              title="Goals"
              right={(props) => goals.length > 0 ? (
                <Button {...props} icon="plus" onPress={() => {
                  // @ts-ignore
                  navigation.navigate('Main', { 
                    screen: 'Goals',
                    params: { openCreate: true }
                  })
                }}>New</Button>
              ) : null}
            />
            <Card.Content>
              {isLoadingGoals ? <ActivityIndicator/> : goals.length > 0 ? (
                  goals.map((goal: Goal, index: number) => (
                    <React.Fragment key={goal.id}>
                      <GoalCard goal={goal} onPress={() => openGoalDetails(goal)} />
                      {index < goals.length - 1 && <Divider style={styles.goalDivider} />}
                    </React.Fragment>
                  ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Avatar.Icon icon="flag-checkered" size={48} style={{backgroundColor: theme.colors.surfaceVariant}}/>
                  <Text variant="titleMedium" style={styles.emptyStateText}>No Goals Set</Text>
                  <Text variant="bodyMedium" style={styles.emptyStateText}>
                    You haven't set any goals yet.
                  </Text>
                  <Button mode="contained" style={styles.emptyStateButton} onPress={() => {
                    // @ts-ignore
                    navigation.navigate('Main', { 
                      screen: 'Goals',
                      params: { openCreate: true }
                    })
                  }}>Set Your First Goal</Button>
                </View>
              )}
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
  return (
    <Card mode="outlined" onPress={onPress} style={styles.goalCard}>
      <Card.Content>
        <View style={styles.goalHeader}>
          <Text variant="titleMedium">{goal.title}</Text>
          <Chip compact>{goal.status}</Chip>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroContent: {
    alignItems: 'center',
    padding: 16,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
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
  goalCard: {
    marginBottom: 8,
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
});

export default Profile;