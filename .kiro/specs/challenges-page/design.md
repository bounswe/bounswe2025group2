# Design Document

## Overview

The Challenges page design directly mirrors the existing Goals page structure, copying its layout, styling, and interaction patterns while adding challenge-specific elements. This approach ensures design consistency and leverages proven UX patterns. The key additions include coach information, participant counts, leaderboard integration, and join/leave functionality.

**CRITICAL: USE EXISTING BACKEND APIs ONLY** - All API integrations must use the already implemented backend endpoints. The challenge API is fully functional with endpoints for search, create, update, delete, join, leave, progress updates, and leaderboards.

## Architecture

### Component Hierarchy (Based on Goals Page)
```
ChallengesPage (copy GoalPage.tsx structure)
├── Layout (existing)
├── Section Header (copy from Goals)
│   ├── Header Content
│   │   ├── Header Text ("Your Challenges" / "Available Challenges")
│   │   └── Page Subtitle
│   └── Create Challenge Button (coaches only, copy Add Goal button)
├── Stats Grid (copy from Goals)
│   ├── Total Challenges Card
│   ├── Joined Challenges Card
│   └── Completed Challenges Card
├── Challenge Tabs (copy Goal tabs pattern)
│   ├── All Challenges
│   ├── Joined
│   ├── Available
│   └── Completed
├── Challenges Grid (copy goals-grid)
│   └── ChallengeCard[] (based on goal-card)
├── ChallengeFormDialog (copy GoalFormDialog)
├── ProgressUpdateDialog (copy from Goals)
└── ChallengeDetailModal (new, for leaderboard)
```

### State Management
Following the existing pattern with React Query:
- Global challenge state via `useChallenges()` hook
- Individual challenge state via `useChallenge(id)` hook
- User-specific data via `useUserChallenges()` hook
- Real-time updates through query invalidation

## Components and Interfaces

### ChallengesPage Component
**Purpose:** Main page container following Goals page pattern
**Props:** None (uses routing)
**State:**
- `selectedChallenge: Challenge | null`
- `isDetailModalOpen: boolean`
- `isFormModalOpen: boolean`
- `isProgressModalOpen: boolean`
- `activeFilter: string`
- `searchQuery: string`

### ChallengeCard Component (Based on Goal Card)
**Purpose:** Display individual challenge information using goal-card styling
**Structure:** Copy goal-card layout and add challenge-specific elements
**Additional Elements:**
- Coach username badge (similar to goal-status-badge)
- Participant count indicator
- Join/Leave button (replaces Edit button for non-coaches)
- View Leaderboard button (additional action)

**Props:**
```typescript
interface ChallengeCardProps {
  challenge: Challenge;
  onJoin: (challengeId: string) => void;
  onLeave: (challengeId: string) => void;
  onViewDetails: (challenge: Challenge) => void;
  onUpdateProgress: (challenge: Challenge) => void;
  isUserParticipant: boolean;
  userProgress?: number;
  isCoach: boolean;
}
```

**Layout Additions to Goal Card:**
```tsx
// Add after goal-title-section
<div className="challenge-meta">
  <span className="coach-badge">By: {challenge.created_by_username}</span>
  <span className="participant-count">{challenge.participant_count} participants</span>
</div>

// Modify goal-card-actions to include challenge-specific buttons
<div className="goal-card-actions"> {/* Reuse existing class */}
  {isUserParticipant ? (
    <>
      <Button variant="positive" size="sm" onClick={() => onUpdateProgress(challenge)}>
        <TrendingUp className="w-4 h-4" />
        Update Progress
      </Button>
      <Button variant="outline" size="sm" onClick={() => onViewDetails(challenge)}>
        <Trophy className="w-4 h-4" />
        Leaderboard
      </Button>
      <Button variant="destructive" size="sm" onClick={() => onLeave(challenge.id)}>
        <UserMinus className="w-4 h-4" />
        Leave
      </Button>
    </>
  ) : (
    <>
      <Button variant="positive" size="sm" onClick={() => onJoin(challenge.id)}>
        <UserPlus className="w-4 h-4" />
        Join Challenge
      </Button>
      <Button variant="outline" size="sm" onClick={() => onViewDetails(challenge)}>
        <Trophy className="w-4 h-4" />
        View Details
      </Button>
    </>
  )}
  {isCoach && challenge.created_by === currentUserId && (
    <Button variant="outline" size="sm" onClick={() => onEdit(challenge)}>
      <Edit className="w-4 h-4" />
      Edit
    </Button>
  )}
</div>
```

### ChallengeDetailModal Component
**Purpose:** Show comprehensive challenge information with leaderboard
**Props:**
```typescript
interface ChallengeDetailModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onJoin: (challengeId: string) => void;
  onLeave: (challengeId: string) => void;
}
```

### Leaderboard Component
**Purpose:** Display ranked participants with different sorting criteria
**Props:**
```typescript
interface LeaderboardProps {
  challengeId: string;
  rankingCriteria: 'progress' | 'absolute' | 'completion_time';
  onCriteriaChange: (criteria: string) => void;
  currentUserId: number;
}
```

### ChallengeFormDialog Component (Copy GoalFormDialog)
**Purpose:** Create and edit challenges using GoalFormDialog as template
**Structure:** Copy GoalFormDialog.tsx structure exactly, modify fields for challenges

**Form Fields (modify from Goals):**
- Title (same as goals)
- Description (same as goals)
- Challenge Type (copy goal_type select)
- Target Value (same as goals)
- Unit (same as goals)
- Start Date (new field)
- End Date (replace target_date from goals)

**Props:**
```typescript
interface ChallengeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingChallenge: Challenge | null;
}
```

**Challenge Type Options (similar to GOAL_TYPE_UNITS):**
```typescript
const CHALLENGE_TYPE_UNITS: Record<string, string[]> = {
  "WALKING_RUNNING": ["km", "miles", "steps"],
  "WORKOUT": ["minutes", "hours", "sessions"],
  "CYCLING": ["km", "miles", "minutes", "hours"],
  "SWIMMING": ["laps", "meters", "km", "minutes"],
  "SPORTS": ["matches", "points", "goals", "minutes", "hours"]
};
```

## API Integration (EXISTING BACKEND ENDPOINTS)

**MANDATORY: Use these exact endpoints - DO NOT modify or create new ones**

### Available Challenge API Endpoints:
- `GET /api/challenges/search/` - Search and filter challenges
- `GET /api/challenges/{id}/` - Get challenge details
- `POST /api/challenges/create/` - Create challenge (coaches only)
- `PUT /api/challenges/{id}/update/` - Update challenge (coach only)
- `DELETE /api/challenges/{id}/delete/` - Delete challenge (coach only)
- `POST /api/challenges/{id}/join/` - Join a challenge
- `POST /api/challenges/{id}/leave/` - Leave a challenge
- `POST /api/challenges/{id}/update-progress/` - Update progress
- `GET /api/challenges/{id}/leaderboard/` - Get leaderboard
- `GET /api/challenges/joined/` - Get user's joined challenges

### Search Parameters (for /api/challenges/search/):
- `is_active` - Filter by active/inactive status
- `user_participating` - Filter by user participation
- `min_age` / `max_age` - Age range filters
- `location` / `radius_km` - Location-based filtering

### Backend Response Format:
The backend returns challenge objects with fields like:
- `id`, `title`, `description`, `challenge_type`
- `target_value`, `unit`, `location`
- `start_date`, `end_date`, `coach` (creator)
- `latitude`, `longitude`, `min_age`, `max_age`

## Data Models

### Challenge Interface (Extended from existing)
```typescript
interface Challenge {
  // Existing fields from api.ts
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  target_value: number;
  challenge_type: string;
  unit: string;
  status: string;
  created_by: number;
  participants: Array<{
    user: string;
    current_value: number;
  }>;
  participant_count?: number;
  is_joined?: boolean;
  
  // Additional fields needed for UI
  created_by_username: string; // Coach name to display
  user_progress?: number; // Current user's progress
  user_ranking?: number; // Current user's rank
  progress_percentage?: number; // Calculated progress %
}
```

### Leaderboard Entry Interface
```typescript
interface LeaderboardEntry {
  user_id: number;
  username: string;
  current_value: number;
  progress_percentage: number;
  ranking: number;
  last_updated: string;
  completion_time?: string;
}
```

### Challenge History Interface
```typescript
interface ChallengeHistory {
  challenge: Challenge;
  final_ranking: number;
  final_progress: number;
  completion_status: 'COMPLETED' | 'ABANDONED' | 'EXPIRED';
  joined_date: string;
  completion_date?: string;
}
```

## Error Handling

### API Error Scenarios
1. **Network Failures:** Display retry buttons with exponential backoff
2. **Authentication Errors:** Redirect to login page
3. **Permission Errors:** Show appropriate access denied messages
4. **Validation Errors:** Display field-specific error messages
5. **Server Errors:** Show generic error with support contact

### User Experience Error Handling
- Loading states for all async operations
- Optimistic updates with rollback on failure
- Clear error messages with actionable solutions
- Graceful degradation when real-time updates fail

## Testing Strategy

### Unit Tests
- Component rendering with various props
- Hook behavior and state management
- Utility functions (date formatting, progress calculation)
- Form validation logic

### Integration Tests
- API integration with mock responses
- User interaction flows (join/leave challenges)
- Real-time update scenarios
- Permission-based feature visibility

### E2E Tests
- Complete user journey: browse → join → update progress → view leaderboard
- Coach journey: create → manage → delete challenges
- Cross-device responsive behavior
- Error recovery scenarios

## Real-time Updates Implementation

### WebSocket Integration (Future Enhancement)
For real-time leaderboard updates:
```typescript
// Hook for real-time challenge updates
function useRealtimeChallengeUpdates(challengeId: string) {
  // WebSocket connection management
  // Automatic query invalidation on updates
  // Fallback to polling if WebSocket fails
}
```

### Current Implementation (Polling)
- Query invalidation every 30 seconds for active challenges
- Manual refresh buttons for immediate updates
- Optimistic updates for user's own progress

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading:** Load challenge details only when needed
2. **Pagination:** Implement virtual scrolling for large challenge lists
3. **Caching:** Aggressive caching with smart invalidation
4. **Image Optimization:** Lazy load challenge images/avatars
5. **Bundle Splitting:** Separate coach-only features into separate chunks

### Monitoring
- Track API response times
- Monitor real-time update frequency
- Measure user engagement metrics
- Performance budgets for mobile devices

## Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation for all interactive elements
- Screen reader support with proper ARIA labels
- Color contrast ratios meeting accessibility standards
- Focus management in modals and dialogs
- Alternative text for challenge images

### Responsive Design Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px  
- Desktop: 1024px+

## Security Considerations

### Permission Validation
- Client-side permission checks for UI elements
- Server-side validation for all API calls
- Coach-only features properly gated
- User data isolation in leaderboards

### Data Privacy
- User progress data only visible to challenge participants
- Optional profile visibility settings
- GDPR compliance for user data export/deletion