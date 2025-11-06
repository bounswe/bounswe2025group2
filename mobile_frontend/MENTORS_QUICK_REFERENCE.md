# Mentors UI - Quick Reference Guide

## Quick Start

### Files Added/Modified

**New Files**:
- `src/types/mentor.ts` - Type definitions
- `src/services/MentorService.ts` - API service
- `src/Pages/MentorSearch.tsx` - Search mentors
- `src/Pages/MentorshipRequests.tsx` - Manage requests
- `src/Pages/MyMentors.tsx` - View your mentors
- `src/Pages/MyMentees.tsx` - View your mentees
- `src/Pages/MenteeGoalManagement.tsx` - Manage mentee goals
- `src/components/MentorNotification.tsx` - Notification components
- `MENTORS_IMPLEMENTATION.md` - Full documentation

**Modified Files**:
- `src/Pages/Profile.tsx` - Added mentorship request button
- `src/navigation/AppNavigator.tsx` - Added mentor routes

## Navigation Routes

```typescript
// Mentor-related routes
'MentorSearch'              // Browse and search mentors
'MentorshipRequests'        // Manage requests
'MyMentors'                 // View your mentors
'MyMentees'                 // View your mentees
'MenteeGoalManagement'      // Manage mentee goals (with params)
```

## Key Functions

### Search Mentors
```typescript
import { searchMentors } from '../services/MentorService';

const mentors = await searchMentors(
  { search: 'John', user_type: 'mentor' },
  getAuthHeader()
);
```

### Send Mentorship Request
```typescript
import { sendMentorshipRequest } from '../services/MentorService';

await sendMentorshipRequest(
  {
    to_user_id: userId,
    request_type: 'MENTOR_REQUEST', // or 'MENTEE_REQUEST'
    message: 'I would like you as my mentor'
  },
  getAuthHeader()
);
```

### Get All Requests
```typescript
import { getMentorshipRequests } from '../services/MentorService';

const { incoming, outgoing } = await getMentorshipRequests(getAuthHeader());
```

### Respond to Request
```typescript
import { respondToMentorshipRequest } from '../services/MentorService';

await respondToMentorshipRequest(
  { request_id: requestId, action: 'approve' }, // or 'reject'
  getAuthHeader()
);
```

### Get Mentors/Mentees
```typescript
import { getMyMentors, getMyMentees } from '../services/MentorService';

const myMentors = await getMyMentors(getAuthHeader());
const myMentees = await getMyMentees(getAuthHeader());
```

### Manage Mentee Goals
```typescript
import {
  getMenteeGoals,
  createMenteeGoal,
  provideFeedback
} from '../services/MentorService';

// Get goals
const goals = await getMenteeGoals(menteeId, getAuthHeader());

// Create goal
await createMenteeGoal(
  {
    mentee_id: menteeId,
    title: 'Run 5km',
    goal_type: 'WALKING_RUNNING',
    target_value: 5,
    unit: 'km',
    target_date: '2025-12-31'
  },
  getAuthHeader()
);

// Provide feedback
await provideFeedback(
  { goal_id: goalId, feedback: 'Great progress!' },
  getAuthHeader()
);
```

## Component Usage

### Using MentorNotificationCard
```typescript
import { MentorNotificationCard } from '../components/MentorNotification';

<MentorNotificationCard
  notification={notification}
  onPress={() => handleNotificationPress()}
  onActionClick={(action) => handleAction(action)}
  colors={colors}
  authHeader={getAuthHeader()}
/>
```

### Using MentorNotificationsList
```typescript
import { MentorNotificationsList } from '../components/MentorNotification';

<MentorNotificationsList
  notifications={mentorNotifications}
  onNotificationPress={(notif) => handlePress(notif)}
  onActionClick={(id, action) => handleAction(id, action)}
  colors={colors}
  authHeader={getAuthHeader()}
/>
```

## Common Patterns

### Error Handling
```typescript
try {
  const result = await sendMentorshipRequest(payload, getAuthHeader());
  Alert.alert('Success', 'Request sent successfully!');
} catch (error: any) {
  Alert.alert('Error', error.message || 'Failed to send request');
}
```

### Loading State
```typescript
const [loading, setLoading] = useState(true);

const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    const data = await getMyMentors(getAuthHeader());
    setMentors(data);
  } finally {
    setLoading(false);
  }
}, [isAuthenticated, getAuthHeader]);

useFocusEffect(useCallback(() => {
  fetchData();
}, [fetchData]));
```

### Authentication Check
```typescript
if (!isAuthenticated) {
  return (
    <View>
      <Text>Please log in to view this content</Text>
    </View>
  );
}
```

## Data Types Reference

### MentorshipRequest
```typescript
{
  id: number;
  from_user: { id, username, name, surname, profile_picture };
  to_user: { id, username, name, surname, profile_picture };
  request_type: 'MENTOR_REQUEST' | 'MENTEE_REQUEST';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  message?: string;
  created_at: string;
  updated_at: string;
}
```

### MentorshipRelationship
```typescript
{
  id: number;
  mentor: { id, username, name, surname, bio, profile_picture };
  mentee: { id, username, name, surname, bio, profile_picture };
  established_at: string;
  goals_count?: number;
  active_goals_count?: number;
}
```

### MenteeGoal
```typescript
{
  id: number;
  title: string;
  description: string;
  mentee: { id, username, name, surname };
  mentor: { id, username, name, surname };
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
```

## Testing Scenarios

### Test Mentorship Request Flow
1. Login as User A
2. Search for User B
3. Click "Request as My Mentor"
4. Login as User B (in another device/emulator)
5. Go to MentorshipRequests
6. Accept the request
7. Both users should see relationship in MyMentors/MyMentees

### Test Goal Management
1. Login as Mentor
2. Go to MyMentees
3. Click "Manage Goals" for a mentee
4. Create a new goal
5. Login as Mentee
6. See goal in Goals page
7. Update progress
8. Login as Mentor
9. See progress updated in MenteeGoalManagement
10. Provide feedback

## Performance Tips

- Use `useFocusEffect` to refresh data when navigating back
- Implement pagination for large lists (if needed)
- Cache mentor data with React Query
- Minimize re-renders with proper memoization
- Load profile pictures lazily

## Known Limitations

- No offline support currently
- Profile pictures require cache busting with timestamp
- No pagination in list views
- No search result caching
- Single mentor relationship per pair (as designed)

## Troubleshooting

### "Failed to fetch requests" Error
- Check internet connection
- Verify authentication token
- Check API endpoint URLs in MentorService.ts

### Mentorship button not showing
- Ensure you're on another user's profile (not your own)
- Check if `otherUsername` prop is set correctly

### Goals not appearing
- Verify the mentee-mentor relationship is established
- Check if the mentor actually created goals for this mentee
- Ensure proper permissions and authentication

### Profile picture not loading
- Check profile picture exists on backend
- Verify URL and authentication headers
- Try cache busting with timestamp parameter
