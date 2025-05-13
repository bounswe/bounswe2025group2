
# Fitness Goals API Documentation

This document provides comprehensive details about the Fitness Goals API for front-end integration.

## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Table of Contents
- [Authentication](#authentication)
- [Endpoints Overview](#endpoints-overview)
- [Detailed Endpoint Documentation](#detailed-endpoint-documentation)
  - [List and Create Fitness Goals](#list-and-create-goals)
  - [Retrieve, Update and Delete a Fitness Goal](#retrieve-update-and-delete-a-fitness-goal)
  - [Update Goal Progress](#update-goal-progress)
  - [Check Inactive Goals](#check-inactive-goals)
- [Models and Data Structures](#models-and-data-structures)
- [Error Handling](#error-handling)
- [Additional Notes](#additional-notes)



## Endpoints Overview

| Method | Endpoint                        | Description                                                        |
|--------|---------------------------------|--------------------------------------------------------------------|
| GET | `/api/goals/`                   | List all fitness goals either set by him as a mentor or plain user |
| POST | `/api/goals/`                   | Create a new fitness goal                                          |
| GET | `/api/goals/:goal_id/`          | Retrieve a specific fitness goal                                   |
| PUT | `/api/goals/:goal_id/`          | Update a specific fitness goal                                     |
| DELETE | `/api/goals/:goal_id/`          | Delete a specific fitness goal                                     |
| PATCH | `/api/goals/:goal_id/progress/` | Update progress for a specific goal                                |
| GET | `/api/goals/check-inactive/`    | Check and mark inactive goals                                      |

## Detailed Endpoint Documentation

### List and Create Fitness Goals

#### `GET /api/goals/`

Retrieves all fitness goals that the authenticated user has access to. This includes goals created by the user and goals where the user is assigned as a mentor.

**Response (200 OK)**
```json
[
  {
    "id": 1,
    "title": "Run 5K",
    "description": "Complete a 5K run under 30 minutes",
    "user": 5,
    "mentor": 3,
    "category": "CARDIO",
    "target_value": 5.0,
    "current_value": 2.5,
    "unit": "km",
    "start_date": "2025-04-10T10:00:00Z",
    "target_date": "2025-05-10T10:00:00Z",
    "status": "ACTIVE",
    "last_updated": "2025-04-20T14:30:00Z"
  },
  // Additional goals...
]
```

#### `POST /api/goals/`

Creates a new fitness goal. The authenticated user will automatically be set as the goal creator.

**Request Body**
```json
{
  "title": "Bench Press Goal",
  "description": "Increase bench press weight to 100kg",
  "user": 5,            // Required only if mentor is creating a goal for mentee
  "category": "STRENGTH",
  "target_value": 100.0,
  "current_value": 80.0,
  "unit": "kg",
  "start_date": "2025-04-24T00:00:00Z",
  "target_date": "2025-06-24T00:00:00Z"
}
```

**Response (201 Created)**
```json
{
  "id": 2,
  "title": "Bench Press Goal",
  "description": "Increase bench press weight to 100kg",
  "user": 5,
  "mentor": 7,   // The authenticated user will be mentor
  "category": "STRENGTH",
  "target_value": 100.0,
  "current_value": 80.0,
  "unit": "kg",
  "start_date": "2025-04-24T00:00:00Z",
  "target_date": "2025-06-24T00:00:00Z",
  "status": "ACTIVE",
  "last_updated": "2025-04-24T15:40:00Z"
}
```

**Notes:**
- If the authenticated user is a Coach and includes a user ID in the request, a notification will be automatically created for the mentee.
- Status is automatically set to "ACTIVE" for new goals.

### Retrieve, Update and Delete a Fitness Goal

#### `GET /api/goals/:goal_id/`

Retrieves a specific fitness goal by its ID.

**Response (200 OK)**
```json
{
  "id": 1,
  "title": "Run 5K",
  "description": "Complete a 5K run under 30 minutes",
  "user": 5,
  "mentor": 3,
  "category": "CARDIO",
  "target_value": 5.0,
  "current_value": 2.5,
  "unit": "km",
  "start_date": "2025-04-10T10:00:00Z",
  "target_date": "2025-05-10T10:00:00Z",
  "status": "ACTIVE",
  "last_updated": "2025-04-20T14:30:00Z"
}
```

#### `PUT /api/goals/:goal_id/`

Updates a specific fitness goal. Partial updates are supported.

**Request Body**
```json
{
  "title": "Updated Goal Title",
  "description": "Updated goal description",
  "target_date": "2025-07-01T00:00:00Z"
}
```

**Response (200 OK)**
```json
{
  "id": 1,
  "title": "Updated Goal Title",
  "description": "Updated goal description",
  "user": 5,
  "mentor": 3,
  "category": "CARDIO",
  "target_value": 5.0,
  "current_value": 2.5,
  "unit": "km",
  "start_date": "2025-04-10T10:00:00Z",
  "target_date": "2025-07-01T00:00:00Z",
  "status": "ACTIVE",
  "last_updated": "2025-04-24T16:30:00Z"
}
```

#### `DELETE /api/goals/:goal_id/`

Deletes a specific fitness goal.

**Response (204 No Content)**

No response body is returned.

### Update Goal Progress

#### `PATCH /api/goals/:goal_id/progress/`

Updates the progress of a specific fitness goal. This endpoint is specifically designed for updating the current value of a goal or restarting a goal.

**Request Body (Update Progress)**
```json
{
  "current_value": 4.0
}
```

**Request Body (Restart Goal)**
```json
{
  "status": "RESTARTED"
}
```

**Response (200 OK)**
```json
{
  "id": 1,
  "title": "Run 5K",
  "description": "Complete a 5K run under 30 minutes",
  "user": 5,
  "mentor": 3,
  "category": "CARDIO",
  "target_value": 5.0,
  "current_value": 4.0,
  "unit": "km",
  "start_date": "2025-04-10T10:00:00Z",
  "target_date": "2025-05-10T10:00:00Z",
  "status": "ACTIVE",
  "last_updated": "2025-04-24T16:45:00Z"
}
```

**Important Note:**
- This endpoint expects the **final value** for the goal progress, not incremental values. Any additions to the previous progress must be calculated in the front-end before sending the request.
- If the `current_value` reaches or exceeds the `target_value`, the goal status will automatically be set to "COMPLETED" and a notification will be created.
- When restarting a goal, the `current_value` will be reset to 0 and the `start_date` will be updated to the current time.

### Check Inactive Goals

#### `GET /api/goals/check-inactive/`

Checks for and marks goals that have been inactive for more than 7 days. A goal is considered inactive if it hasn't been updated in the last 7 days.

**Response (200 OK)**
```json
{
  "message": "3 goals marked as inactive"
}
```


### View a Mentee's Goals (Mentor-Only Access)

**Endpoint:** `GET /api/goals/user/<user_id>/`

**Description:**
Allows a mentor to view the fitness goals of a specific user (mentee) by their user ID.

**Permissions:**
- Only mentors can access this endpoint.
- The requested user must be a mentee of the authenticated mentor (i.e., `user.mentor == request.user`).

**Response:**
Returns a list of goals for the specified mentee if the mentor-mentee relationship is valid.


**Example Response:**
```json
[
    {
        "id": 1,
        "user": 5,
        "goal_type": "Lose Weight",
        "description": "Lose 5 kg in 2 months",
        "target_value": 5.0,
        "progress_value": 2.0,
        "progress_percentage": 40.0,
        "is_completed": false,
        "start_date": "2025-05-01",
        "end_date": "2025-07-01",
        "created_at": "2025-05-01T10:00:00Z",
        "updated_at": "2025-05-10T14:22:31Z"
    }
]
```

**Errors:**
- `403 Forbidden`: If the requester is not a mentor or the target user is not their mentee.
- `404 Not Found`: If the specified user does not exist.


**Notes:**
- For each inactive goal, the status will be changed to "INACTIVE".
- A notification will be created for each inactive goal to remind the user.
- This endpoint is typically used for periodic checks, such as via a cron job or scheduled task, but can also be triggered manually.

## Models and Data Structures

### Fitness Goal Model

| Field | Type | Description                                                                     |
|-------|------|---------------------------------------------------------------------------------|
| id | Integer | Unique identifier for the goal                                                  |
| title | String | The title of the fitness goal                                                   |
| description | String | Detailed description of the goal                                                |
| user | Integer | User ID of the goal owner                                                       |
| mentor | Integer (Optional) | User ID of the mentor assigned to the goal                                 |
| category | String | Category of the goal (e.g., WALKING_RUNNING, WORKOUT, CYCLING, SPORTS, SWIMMING) |
| target_value | Float | Target numerical value to achieve                                               |
| current_value | Float | Current progress value                                                          |
| unit | String | Unit of measurement (e.g., kg, km, reps)                                        |
| start_date | DateTime | When the goal was started                                                       |
| target_date | DateTime | Deadline for completing the goal                                                |
| status | String | Current status (ACTIVE, COMPLETED, INACTIVE, RESTARTED)                         |
| last_updated | DateTime | When the goal was last updated                                                  |

### Notification Types

The API automatically generates notifications in the following scenarios:

1. **GOAL** - When a coach assigns a new goal to a mentee
2. **ACHIEVEMENT** - When a user completes a goal
3. **GOAL_INACTIVE** - When a goal has been inactive for more than 7 days

## Error Handling

### Common Error Responses

| Status Code | Description |
|-------------|-------------|
| 400 Bad Request | Invalid request body or parameters |
| 401 Unauthorized | Authentication credentials were not provided or are invalid |
| 403 Forbidden | The authenticated user doesn't have permission to access the resource |
| 404 Not Found | The requested resource was not found |
| 500 Server Error | An unexpected error occurred on the server |

Error responses will include a JSON body with details about the error:

```json
{
  "detail": "Error message describing the issue"
}
```

## Additional Notes

1. Both users and their mentors/coaches can view the user's goals.
2. Only the user who created a goal or is assigned as a mentor can retrieve, update, or delete that goal.
3. The progress update endpoint is designed for the goal owner only.
4. Automatic notifications are generated for:
   - New goals assigned by coaches
   - Completed goals
   - Goals that become inactive
5. All timestamps are in UTC format.
