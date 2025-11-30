# Login Tracking & Activity Dashboard API Documentation

## Overview
The login tracking feature automatically tracks consecutive daily logins and provides detailed statistics for building activity dashboards. This feature includes calendar integration showing login streaks, goal deadlines, and challenge deadlines.

## Database Schema

### UserWithType Model - New Fields

```python
class UserWithType(AbstractUser):
    # ... existing fields ...
    
    # Daily login tracking fields
    current_streak = IntegerField(default=0)
    longest_streak = IntegerField(default=0)
    last_login_date = DateField(null=True, blank=True)
    total_login_days = IntegerField(default=0)
```

**Field Descriptions:**
- `current_streak`: Current consecutive days the user has logged in
- `longest_streak`: The longest streak the user has ever achieved
- `last_login_date`: The last date the user logged in (date only, no time)
- `total_login_days`: Total number of unique days the user has logged in

## API Endpoints

### 1. Get Current User (Enhanced)
**Endpoint:** `GET /api/user/`

**Description:** Returns current user information including login streak data.

**Authentication:** Required

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "user_type": "User",
  "is_verified_coach": false,
  "current_streak": 5,
  "longest_streak": 12,
  "last_login_date": "2025-11-06",
  "total_login_days": 45
}
```

### 2. Get Login Statistics
**Endpoint:** `GET /api/user/login-stats/`

**Description:** Returns detailed login statistics including calendar data for dashboard visualization.

**Authentication:** Required

**Response:**
```json
{
  "current_streak": 5,
  "longest_streak": 12,
  "total_login_days": 45,
  "last_login_date": "2025-11-06",
  "streak_active": true,
  "days_until_break": 1,
  "login_calendar": [
    {
      "date": "2025-11-02",
      "logged_in": true
    },
    {
      "date": "2025-11-03",
      "logged_in": true
    },
    {
      "date": "2025-11-04",
      "logged_in": true
    },
    {
      "date": "2025-11-05",
      "logged_in": true
    },
    {
      "date": "2025-11-06",
      "logged_in": true
    }
  ],
  "logged_in_today": true
}
```

**Response Fields:**
- `current_streak`: Current consecutive login days
- `longest_streak`: Best streak ever achieved
- `total_login_days`: Total unique days logged in
- `last_login_date`: Last login date (ISO format)
- `streak_active`: Boolean indicating if streak is still active (logged in today or yesterday)
- `days_until_break`: Days until streak breaks (0 = breaks today if not logged in, 1 = breaks tomorrow)
- `login_calendar`: Array of login dates for the current streak (last 90 days max)
- `logged_in_today`: Boolean indicating if user has logged in today

## Automatic Tracking

### Login Flow
The login streak is automatically updated when a user logs in through the `/api/login/` endpoint.

**Streak Logic:**
1. **First Login:** Sets `current_streak = 1`, `longest_streak = 1`, `total_login_days = 1`
2. **Same Day Login:** No changes (prevents multiple increments per day)
3. **Consecutive Day Login:** Increments `current_streak` and `total_login_days`
4. **Streak Broken:** Resets `current_streak = 1`, increments `total_login_days`
5. **Longest Streak Update:** Updates `longest_streak` if `current_streak` exceeds it

### Example Scenarios

**Scenario 1: Consecutive Logins**
- Day 1: Login → `current_streak = 1`
- Day 2: Login → `current_streak = 2`
- Day 3: Login → `current_streak = 3`

**Scenario 2: Broken Streak**
- Day 1: Login → `current_streak = 3`
- Day 2: No login
- Day 3: Login → `current_streak = 1` (streak reset)

**Scenario 3: Multiple Logins Same Day**
- Day 1 (9:00 AM): Login → `current_streak = 1`
- Day 1 (3:00 PM): Login → `current_streak = 1` (no change)

## Frontend Integration

### React Hooks

**useLoginStats Hook:**
```typescript
import { useLoginStats } from '@/lib';

function MyComponent() {
  const { data: loginStats, isLoading } = useLoginStats();
  
  return (
    <div>
      <p>Current Streak: {loginStats?.current_streak}</p>
      <p>Longest Streak: {loginStats?.longest_streak}</p>
    </div>
  );
}
```

### Activity Dashboard Component

The `ActivityDashboard` component provides:
1. **Login Streak Display:** Shows current streak, longest streak, and total login days
2. **Upcoming Deadlines:** Lists goals and challenges ending in the next 7 days
3. **Calendar View:** Monthly calendar showing:
   - Login days (marked with 🔥)
   - Goal deadlines (marked with 🎯)
   - Challenge deadlines (marked with 🏆)

**Usage:**
```tsx
import { ActivityDashboard } from '@/components';

function HomePage() {
  const { data: goals = [] } = useGoals();
  const { data: challenges = [] } = useChallenges();
  
  return (
    <ActivityDashboard 
      goals={goals} 
      challenges={challenges} 
    />
  );
}
```

## Database Migration

A migration file has been created to add the new fields to the database:

**Migration:** `0002_add_login_tracking.py`

**To apply the migration:**
```bash
# If using Docker
docker-compose exec web python manage.py migrate

# If running locally
python manage.py migrate
```

## Testing

### Manual Testing

1. **Test First Login:**
   ```bash
   # Login for the first time
   curl -X POST http://localhost:8000/api/login/ \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "testpass123"}'
   
   # Check stats
   curl http://localhost:8000/api/user/login-stats/ \
     -H "Cookie: sessionid=YOUR_SESSION_ID"
   ```

2. **Test Consecutive Logins:**
   - Login on consecutive days
   - Verify `current_streak` increments
   - Verify `login_calendar` shows all login days

3. **Test Broken Streak:**
   - Skip a day
   - Login again
   - Verify `current_streak` resets to 1
   - Verify `longest_streak` remains unchanged if previous streak was longer

### Automated Testing

Add tests to `/backend/genfit_django/api/tests/test_auth.py`:

```python
def test_login_streak_first_time(client):
    # Create user
    user = User.objects.create_user(username='test', password='test123')
    
    # Login
    response = client.post('/api/login/', {
        'username': 'test',
        'password': 'test123'
    })
    
    # Check streak
    user.refresh_from_db()
    assert user.current_streak == 1
    assert user.longest_streak == 1
    assert user.total_login_days == 1

def test_login_streak_consecutive_days(client):
    # Test consecutive day login logic
    # (Implementation depends on your test setup)
    pass
```

## Performance Considerations

1. **Database Queries:** The login stats endpoint performs minimal queries (single user lookup)
2. **Caching:** Frontend uses React Query with 1-minute stale time for login stats
3. **Calendar Data:** Limited to last 90 days to prevent excessive data transfer

## Future Enhancements

Potential improvements:
1. **Login History Table:** Track every login date for more detailed analytics
2. **Rewards System:** Award badges/points for streak milestones
3. **Notifications:** Remind users to maintain their streak
4. **Leaderboard:** Show top users by longest streak
5. **Weekly/Monthly Stats:** Aggregate login patterns by week/month

## Troubleshooting

### Streak Not Updating
- Verify user is actually logging in through `/api/login/` endpoint
- Check that migration has been applied
- Verify `update_login_streak()` is being called in login view

### Calendar Not Showing Logins
- Check that `last_login_date` is being set correctly
- Verify frontend is correctly parsing ISO date strings
- Check browser console for any errors

### Incorrect Streak Count
- Verify server timezone settings match expected behavior
- Check that date comparisons use `date.today()` not `datetime.now()`
- Ensure multiple logins per day don't increment streak

