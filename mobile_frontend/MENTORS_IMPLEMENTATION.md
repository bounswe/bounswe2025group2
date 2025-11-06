# Mobile Frontend - Mentors UI Implementation

This document describes the mentor-mentee system implementation for the mobile frontend of GenFit.

## Overview

The mentor-mentee system allows users to establish professional relationships where mentors can guide, set goals for, and track the progress of their mentees. The implementation includes:

- **Mentor Discovery**: Search and filter available mentors
- **Mentorship Requests**: Send and manage mentor-mentee relationship requests
- **Relationship Management**: View and manage active mentor-mentee relationships
- **Goal Management**: Mentors can set and track goals for their mentees
- **Feedback System**: Mentors can provide feedback and guidance to mentees
- **Notifications**: Real-time notifications for mentor-related events

## Architecture

### Directory Structure

```
src/
├── Pages/
│   ├── MentorSearch.tsx              # Search and discover mentors
│   ├── MentorshipRequests.tsx        # Manage incoming/outgoing requests
│   ├── MyMentors.tsx                 # View your mentors
│   ├── MyMentees.tsx                 # View your mentees
│   ├── MenteeGoalManagement.tsx      # Manage mentee goals
│   └── Profile.tsx                   # Enhanced with mentorship requests
├── services/
│   └── MentorService.ts              # API service for mentor operations
├── types/
│   └── mentor.ts                     # TypeScript type definitions
├── components/
│   └── MentorNotification.tsx        # Mentor notification components
└── navigation/
    └── AppNavigator.tsx              # Updated with mentor routes
```

### Type Definitions

Located in `src/types/mentor.ts`:

- **MentorshipRequest**: Represents a mentor-mentee relationship request
- **MentorshipRelationship**: Represents an active mentor-mentee relationship
- **MentorProfile**: Extended user profile with mentor information
- **MenteeGoal**: Goal assigned by mentor to mentee
- **MentorNotification**: Mentor-related notification

### API Service

Located in `src/services/MentorService.ts`:

#### Mentor Search & Discovery
- `searchMentors(filters, authHeader)`: Search mentors by criteria
- `getAvailableMentors(authHeader)`: Get list of all available mentors
- `getMentorByUsername(username, authHeader)`: Get specific mentor details

#### Mentorship Requests
- `sendMentorshipRequest(payload, authHeader)`: Send a mentorship request
- `getMentorshipRequests(authHeader)`: Get all requests (incoming/outgoing)
- `getIncomingRequests(authHeader)`: Get incoming requests only
- `getOutgoingRequests(authHeader)`: Get outgoing requests only
- `respondToMentorshipRequest(payload, authHeader)`: Approve or reject request
- `cancelMentorshipRequest(requestId, authHeader)`: Cancel sent request

#### Mentor-Mentee Relationships
- `getMyMentors(authHeader)`: Get all mentors of current user
- `getMyMentees(authHeader)`: Get all mentees of current user
- `endMentorship(relationshipId, authHeader)`: End a mentorship

#### Mentee Goal Management
- `getMenteeGoals(menteeId, authHeader)`: Get all goals for a mentee
- `createMenteeGoal(payload, authHeader)`: Create a new goal for mentee
- `updateMenteeGoal(goalId, payload, authHeader)`: Update mentee goal
- `deleteMenteeGoal(goalId, authHeader)`: Delete a mentee goal
- `provideFeedback(payload, authHeader)`: Provide feedback on goal
- `trackMenteeProgress(goalId, authHeader)`: Get goal progress history

#### Profile Visibility
- `updateProfileVisibility(payload, authHeader)`: Update profile visibility settings
- `getProfileVisibility(authHeader)`: Get current visibility settings

## Pages

### 1. MentorSearch (`MentorSearch.tsx`)

**Purpose**: Browse and discover available mentors

**Features**:
- Search mentors by name or username
- Filter by mentor type (all, mentors, coaches)
- View mentor profiles with:
  - Name, username, bio
  - Location and specialization
  - Number of mentees
  - Years of experience
  - Rating
- Send mentorship requests directly
- View full mentor profile

**Usage**:
```tsx
// Navigation
navigation.navigate('MentorSearch');
```

### 2. MentorshipRequests (`MentorshipRequests.tsx`)

**Purpose**: Manage mentorship relationship requests

**Features**:
- View incoming requests (pending approval)
- View outgoing requests (awaiting response)
- Accept incoming mentorship requests
- Reject incoming requests
- Cancel outgoing requests
- View request details and messages

**Usage**:
```tsx
// Navigation
navigation.navigate('MentorshipRequests');
```

**Incoming Tab**:
- Shows requests from users who want you as mentor or want to be your mentor
- Options: Accept or Reject

**Outgoing Tab**:
- Shows requests you sent to other users
- Options: Cancel Request

### 3. MyMentors (`MyMentors.tsx`)

**Purpose**: View and manage your mentors

**Features**:
- List all active mentors
- View mentor profiles and details
- See goals they've assigned to you
- View active goals count
- End mentorship relationships
- Access to goal tracking

**Usage**:
```tsx
// Navigation
navigation.navigate('MyMentors');

// From mentors page, click "View Goals" to see goals assigned by that mentor
```

### 4. MyMentees (`MyMentees.tsx`)

**Purpose**: View and manage your mentees

**Features**:
- List all active mentees
- View mentee profiles and details
- See goals you've assigned
- View active goals count
- Manage goals for each mentee
- End mentorship relationships
- Access MenteeGoalManagement

**Usage**:
```tsx
// Navigation
navigation.navigate('MyMentees');

// Click "Manage Goals" to open goal management for a mentee
```

### 5. MenteeGoalManagement (`MenteeGoalManagement.tsx`)

**Purpose**: Mentors manage goals for their mentees

**Features**:
- View all goals for a specific mentee
- Create new goals for mentee with:
  - Title and description
  - Goal type (Walking/Running, Workout, Cycling, Sports, Swimming)
  - Target value and unit
  - Target date
- Edit existing goals
- Delete goals
- Provide feedback on goal progress
- Track progress with visual indicators
- See goal status and completion percentage

**Usage**:
```tsx
// Navigation
navigation.navigate('MenteeGoalManagement', {
  menteeId: menteeId,
  menteeName: menteeName
});
```

### 6. Profile (Enhanced)

**Purpose**: User profiles now include mentorship functionality

**Features Added**:
- "Request Mentorship" button on other users' profiles
- Two options:
  - "Request as My Mentor": Ask the user to be your mentor
  - "Offer to be Mentor": Offer to mentor the user

**Usage**:
```tsx
// When viewing another user's profile, click the "Request Mentorship" button
// to open a menu with mentorship options
```

## Components

### MentorNotification (`MentorNotification.tsx`)

**Notification Types**:
- `mentorship_request_received`: New mentorship request
- `mentorship_request_approved`: Your request was approved
- `goal_assigned`: Mentor assigned a new goal
- `feedback_received`: Mentor provided feedback
- `mentee_progress_update`: Mentee made progress on goal
- `mentee_goal_completed`: Mentee completed a goal

**Components**:
- `MentorNotificationCard`: Individual notification card
- `MentorNotificationsList`: List of notifications

## Workflows

### Becoming a Mentor-Mentee Pair

1. **User A** (potential mentee) navigates to `MentorSearch`
2. **User A** finds and views **User B's** profile
3. **User A** clicks "Request Mentorship" → "Request as My Mentor"
4. **User B** receives notification in mentorship requests
5. **User B** navigates to `MentorshipRequests` and approves
6. Mentorship relationship is established
7. Both users can now see each other in `MyMentors`/`MyMentees`

### Setting Goals for Mentees

1. Mentor navigates to `MyMentees`
2. Selects a mentee and clicks "Manage Goals"
3. Clicks "+ New Goal"
4. Fills in goal details:
   - Title: "Run 10km"
   - Type: "Walking/Running"
   - Target: 10 km
   - Deadline: (select date)
5. Clicks "Save"
6. Goal is assigned to mentee
7. Mentee sees goal in their Goals page
8. Mentor can provide feedback by clicking "Feedback" button

### Tracking Mentee Progress

1. Mentor in `MenteeGoalManagement` sees goals with progress bars
2. Progress shows: "current_value / target_value unit"
3. Completion percentage is displayed
4. Status shows current state (ACTIVE, COMPLETED)
5. Mentor can click "Feedback" to provide guidance

## Integration with Existing Features

### Goals Page
- Goals set by mentors appear in the user's Goals page
- Marked as being set by their mentor
- Mentees can update progress on mentor-assigned goals
- Similar UI to personal goals with added context

### Profile Visibility
- Profile visibility settings affect mentor access
- "PRIVATE": Only visible to approved mentors
- "PUBLIC": Visible to all users for mentorship discovery
- "MENTORS_ONLY": Only visible to established mentor connections

### Notifications
- Mentor notification events trigger system notifications
- Users can view history in Notifications page
- MentorNotification component can be integrated into main notification system

## API Endpoints (Expected Backend)

The service expects these endpoints on the backend:

```
GET/POST  /api/mentors/                          - List/search mentors
GET       /api/mentors/{username}/                - Get mentor details
POST      /api/mentorship/requests/               - Send/view requests
POST      /api/mentorship/requests/{id}/approve/  - Approve request
POST      /api/mentorship/requests/{id}/reject/   - Reject request
POST      /api/mentorship/requests/{id}/cancel/   - Cancel request
GET       /api/mentorship/my-mentors/             - Get user's mentors
GET       /api/mentorship/my-mentees/             - Get user's mentees
POST      /api/mentorship/relationships/{id}/end/ - End mentorship
GET/POST  /api/mentorship/mentee-goals/           - Manage mentee goals
GET       /api/mentorship/mentees/{id}/goals/     - Get mentee goals
POST      /api/mentorship/mentee-goals/{id}/feedback/ - Provide feedback
GET       /api/profile/visibility/                - Get visibility settings
PATCH     /api/profile/visibility/                - Update visibility
```

## Authentication

All mentor-related API calls require authentication:
- Token-based authentication (Bearer token)
- CSRF token for POST/PUT/PATCH/DELETE requests
- Authentication header included in all requests

## Error Handling

All pages include:
- Error alerts for failed operations
- Loading states during async operations
- Empty states when no data available
- Validation for form inputs
- User-friendly error messages

## Styling

All components use:
- Theme context for colors and styling
- Consistent UI patterns from existing app
- Material Design components (react-native-paper)
- Responsive layouts for different screen sizes

## Future Enhancements

Potential features for future implementation:
- Advanced mentor filtering and recommendations
- Mentor ratings and reviews system
- Batch goal assignment
- Progress milestone notifications
- Goal templates library
- Mentor-mentee chat integration
- Analytics dashboard for mentors
- Gamification and achievements
- Mentor certification system
- Group mentoring capabilities
