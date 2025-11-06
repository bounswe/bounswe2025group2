# Backend Implementation Checklist for Mentors System

This checklist outlines what the backend needs to implement to support the mobile frontend's mentor system.

## 📋 Database Models & Fields

### MentorshipRequest Model
- [ ] `id` (Primary Key)
- [ ] `from_user` (ForeignKey to User)
- [ ] `to_user` (ForeignKey to User)
- [ ] `request_type` (CharField: MENTOR_REQUEST, MENTEE_REQUEST)
- [ ] `status` (CharField: PENDING, APPROVED, REJECTED, CANCELLED)
- [ ] `message` (TextField, nullable)
- [ ] `created_at` (DateTime)
- [ ] `updated_at` (DateTime)

**Constraints**:
- No duplicate pending requests between same users
- Cannot request self
- Status transitions: PENDING → (APPROVED, REJECTED, CANCELLED)

### MentorshipRelationship Model
- [ ] `id` (Primary Key)
- [ ] `mentor` (ForeignKey to User)
- [ ] `mentee` (ForeignKey to User)
- [ ] `established_at` (DateTime)
- [ ] One relationship per mentor-mentee pair

**Methods/Properties**:
- [ ] `goals_count` - Total goals for this mentee
- [ ] `active_goals_count` - Active goals only

### MenteeGoal Model
- [ ] `id` (Primary Key)
- [ ] `title` (CharField)
- [ ] `description` (TextField, nullable)
- [ ] `mentee` (ForeignKey to User)
- [ ] `mentor` (ForeignKey to User)
- [ ] `goal_type` (CharField: WALKING_RUNNING, WORKOUT, CYCLING, SPORTS, SWIMMING)
- [ ] `target_value` (IntegerField)
- [ ] `current_value` (IntegerField, default=0)
- [ ] `unit` (CharField)
- [ ] `start_date` (DateTimeField)
- [ ] `target_date` (DateTimeField)
- [ ] `status` (CharField: ACTIVE, COMPLETED, RESTARTED)
- [ ] `last_updated` (DateTimeField)
- [ ] `feedback` (TextField, nullable)

**Validation**:
- [ ] Only mentor of relationship can create/edit goals
- [ ] Only mentee can update progress (`current_value`)
- [ ] Target value must be positive

### User Profile Visibility Model
- [ ] `user` (OneToOneField to User)
- [ ] `visibility` (CharField: PUBLIC, PRIVATE, FRIENDS_ONLY, MENTORS_ONLY)
- [ ] Default: PUBLIC

## 🔌 API Endpoints

### Authentication
- [ ] All endpoints require Bearer token authentication
- [ ] CSRF token required for POST, PUT, PATCH, DELETE

### Mentor Search & Discovery

#### `GET /api/mentors/`
- **Description**: List all available mentors
- **Query Parameters**:
  - `search` (optional): Search by name/username
  - `location` (optional): Filter by location
  - `user_type` (optional): mentor, coach
  - `min_rating` (optional): Minimum rating
  - `specialization` (optional): Specialization filter
- **Response**: List of MentorProfile objects
- **Status Codes**: 200, 401

#### `GET /api/mentors/search/`
- **Description**: Search mentors (alias for GET /mentors/)
- **Query Parameters**: Same as above
- **Response**: List of MentorProfile objects

#### `GET /api/mentors/{username}/`
- **Description**: Get specific mentor details
- **Response**: MentorProfile object with additional stats
- **Status Codes**: 200, 404, 401

### Mentorship Requests

#### `GET /api/mentorship/requests/`
- **Description**: Get all mentorship requests
- **Response**: `{ "incoming": [...], "outgoing": [...] }`
- **Status Codes**: 200, 401

#### `GET /api/mentorship/requests/incoming/`
- **Description**: Get incoming requests only
- **Response**: List of MentorshipRequest objects
- **Status Codes**: 200, 401

#### `GET /api/mentorship/requests/outgoing/`
- **Description**: Get outgoing requests only
- **Response**: List of MentorshipRequest objects
- **Status Codes**: 200, 401

#### `POST /api/mentorship/requests/`
- **Description**: Send a mentorship request
- **Body**:
  ```json
  {
    "to_user_id": 123,
    "request_type": "MENTOR_REQUEST",
    "message": "optional message"
  }
  ```
- **Validation**:
  - [ ] Cannot request self
  - [ ] No duplicate pending requests
  - [ ] User exists
- **Response**: MentorshipRequest object
- **Status Codes**: 201, 400, 401, 404

#### `POST /api/mentorship/requests/{id}/approve/`
- **Description**: Approve a mentorship request
- **Pre-conditions**: Must be recipient of request
- **Side Effects**:
  - [ ] Create MentorshipRelationship
  - [ ] Update request status to APPROVED
  - [ ] Send notification to requester
- **Response**: MentorshipRequest object
- **Status Codes**: 200, 400, 401, 404

#### `POST /api/mentorship/requests/{id}/reject/`
- **Description**: Reject a mentorship request
- **Pre-conditions**: Must be recipient of request
- **Side Effects**:
  - [ ] Update request status to REJECTED
  - [ ] Send notification to requester
- **Response**: MentorshipRequest object
- **Status Codes**: 200, 400, 401, 404

#### `POST /api/mentorship/requests/{id}/cancel/`
- **Description**: Cancel sent mentorship request
- **Pre-conditions**: Must be sender of request
- **Side Effects**:
  - [ ] Update request status to CANCELLED
- **Response**: MentorshipRequest object
- **Status Codes**: 200, 400, 401, 404

### Mentor-Mentee Relationships

#### `GET /api/mentorship/my-mentors/`
- **Description**: Get all mentors of current user
- **Response**: List of MentorshipRelationship objects
- **Status Codes**: 200, 401

#### `GET /api/mentorship/my-mentees/`
- **Description**: Get all mentees of current user
- **Response**: List of MentorshipRelationship objects
- **Status Codes**: 200, 401

#### `POST /api/mentorship/relationships/{id}/end/`
- **Description**: End a mentorship relationship
- **Pre-conditions**: Must be part of relationship
- **Side Effects**:
  - [ ] Delete or mark relationship as inactive
  - [ ] Optionally archive goals
- **Response**: Success message or relationship object
- **Status Codes**: 200, 400, 401, 404

### Mentee Goal Management

#### `GET /api/mentorship/mentee-goals/`
- **Description**: List mentee goals (for mentors)
- **Query Parameters**:
  - `mentee_id` (optional): Filter by mentee
  - `status` (optional): ACTIVE, COMPLETED, RESTARTED
- **Response**: List of MenteeGoal objects
- **Status Codes**: 200, 401

#### `GET /api/mentorship/mentees/{mentee_id}/goals/`
- **Description**: Get all goals for a specific mentee
- **Pre-conditions**: User must be mentor of mentee
- **Response**: List of MenteeGoal objects
- **Status Codes**: 200, 401, 403, 404

#### `POST /api/mentorship/mentee-goals/`
- **Description**: Create new goal for mentee
- **Body**:
  ```json
  {
    "mentee_id": 123,
    "title": "Run 5km",
    "description": "optional",
    "goal_type": "WALKING_RUNNING",
    "target_value": 5,
    "unit": "km",
    "target_date": "2025-12-31T00:00:00Z"
  }
  ```
- **Validation**:
  - [ ] User must be mentor of mentee
  - [ ] Target value > 0
  - [ ] Valid goal type
  - [ ] Target date in future
- **Side Effects**:
  - [ ] Send notification to mentee
- **Response**: MenteeGoal object
- **Status Codes**: 201, 400, 401, 403, 404

#### `PUT /api/mentorship/mentee-goals/{id}/`
- **Description**: Update mentee goal
- **Body**: Partial goal update (all fields optional)
- **Validation**:
  - [ ] User must be mentor
  - [ ] Cannot change mentee or mentor
- **Response**: Updated MenteeGoal object
- **Status Codes**: 200, 400, 401, 403, 404

#### `PATCH /api/mentorship/mentee-goals/{id}/`
- **Description**: Partial update of goal
- **Body**: Only fields to update
- **Validation**: Same as PUT
- **Response**: Updated MenteeGoal object
- **Status Codes**: 200, 400, 401, 403, 404

#### `DELETE /api/mentorship/mentee-goals/{id}/`
- **Description**: Delete mentee goal
- **Pre-conditions**: User must be mentor
- **Side Effects**:
  - [ ] Optionally notify mentee
- **Status Codes**: 204, 401, 403, 404

#### `PATCH /api/mentorship/mentee-goals/{id}/progress/`
- **Description**: Update goal progress
- **Body**:
  ```json
  {
    "current_value": 3
  }
  ```
- **Pre-conditions**: User must be mentee or mentor
- **Validation**:
  - [ ] Current value >= 0
  - [ ] Current value <= target value (cap at target)
- **Side Effects**:
  - [ ] Update `last_updated`
  - [ ] Check if goal completed
  - [ ] Send notification to mentor
- **Response**: Updated MenteeGoal object
- **Status Codes**: 200, 400, 401, 403, 404

#### `POST /api/mentorship/mentee-goals/{id}/feedback/`
- **Description**: Provide feedback on goal
- **Body**:
  ```json
  {
    "feedback": "Great progress! Keep it up!"
  }
  ```
- **Pre-conditions**: User must be mentor
- **Side Effects**:
  - [ ] Update goal's feedback field
  - [ ] Send notification to mentee
  - [ ] Update `last_updated`
- **Response**: Updated MenteeGoal object
- **Status Codes**: 200, 400, 401, 403, 404

#### `GET /api/mentorship/mentee-goals/{id}/progress/`
- **Description**: Get goal progress history
- **Response**:
  ```json
  {
    "goal": { ...goal object },
    "progress_history": [ { "value": 1, "date": "..." }, ... ]
  }
  ```
- **Status Codes**: 200, 401, 403, 404

### Profile Visibility

#### `GET /api/profile/visibility/`
- **Description**: Get user's profile visibility settings
- **Response**: `{ "visibility": "PUBLIC" }`
- **Status Codes**: 200, 401

#### `PATCH /api/profile/visibility/`
- **Description**: Update profile visibility
- **Body**: `{ "visibility": "PUBLIC" | "PRIVATE" | "FRIENDS_ONLY" | "MENTORS_ONLY" }`
- **Response**: Updated visibility settings
- **Status Codes**: 200, 400, 401

## 🔔 Notification Events

The backend should trigger these notification events:

- [ ] `mentorship_request_received` - When user receives request
- [ ] `mentorship_request_approved` - When request is approved
- [ ] `goal_assigned` - When mentor assigns goal
- [ ] `feedback_received` - When mentor provides feedback
- [ ] `mentee_progress_update` - When mentee updates goal progress
- [ ] `mentee_goal_completed` - When goal is completed

## 📊 Serializers & Responses

### MentorProfile Serializer
```python
{
  "id": int,
  "username": str,
  "name": str,
  "surname": str,
  "bio": str,
  "location": str,
  "profile_picture": str (URL),
  "user_type": str,
  "mentee_count": int,
  "specialization": [str],
  "rating": float,
  "experience_years": int
}
```

### MentorshipRequest Serializer
```python
{
  "id": int,
  "from_user": { "id", "username", "name", "surname", "profile_picture" },
  "to_user": { "id", "username", "name", "surname", "profile_picture" },
  "request_type": str,
  "status": str,
  "message": str,
  "created_at": datetime,
  "updated_at": datetime
}
```

### MentorshipRelationship Serializer
```python
{
  "id": int,
  "mentor": { "id", "username", "name", "surname", "bio", "profile_picture" },
  "mentee": { "id", "username", "name", "surname", "bio", "profile_picture" },
  "established_at": datetime,
  "goals_count": int,
  "active_goals_count": int
}
```

### MenteeGoal Serializer
```python
{
  "id": int,
  "title": str,
  "description": str,
  "mentee": { "id", "username", "name", "surname" },
  "mentor": { "id", "username", "name", "surname" },
  "goal_type": str,
  "target_value": int,
  "current_value": int,
  "unit": str,
  "start_date": datetime,
  "target_date": datetime,
  "status": str,
  "last_updated": datetime,
  "feedback": str
}
```

## 🔒 Permission & Authorization

- [ ] Users can only view their own mentors/mentees
- [ ] Only mentors can create/edit/delete goals for mentees
- [ ] Only mentees can update goal progress
- [ ] Only mentors can provide feedback
- [ ] Respect profile visibility settings
- [ ] Validate mentor-mentee relationship exists before allowing operations

## ✅ Testing Checklist

- [ ] Send mentorship request flow works end-to-end
- [ ] Approve/reject requests updates relationship correctly
- [ ] Goal creation assigns to correct mentee
- [ ] Progress updates work correctly
- [ ] Feedback system works
- [ ] Notifications trigger at correct times
- [ ] Permissions are enforced correctly
- [ ] Error responses have appropriate status codes
- [ ] All edge cases handled (self-requests, duplicates, etc.)

## 📚 Additional Considerations

- [ ] Implement rate limiting for requests
- [ ] Add pagination for list endpoints
- [ ] Cache mentors list if necessary
- [ ] Log all mentorship actions
- [ ] Add transaction handling for relationship creation
- [ ] Cleanup orphaned goals if mentorship ends
- [ ] Consider mentor rating/review system
- [ ] Add mentor verification badges

## 🚀 Deployment Steps

1. [ ] Create database migrations for new models
2. [ ] Run migrations in production
3. [ ] Deploy backend with mentor endpoints
4. [ ] Test all endpoints with frontend
5. [ ] Monitor for errors and edge cases
6. [ ] Document any deviations from spec

---

**Note**: This checklist should be used in conjunction with `MENTORS_IMPLEMENTATION.md` for complete understanding of the system requirements.
