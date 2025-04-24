# API Documentation

This document outlines the API endpoints for
- getting a notification and getting all notifications
- marking a notification as read and marking all notifications as read


## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).


## Notification Endpoints

###  Get Notifications

Gets all notifications for the currently authenticated user.

- **URL**: `/notifications/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body**: None

**Response**:


- **Success (200 OK)**
 ```json
[
  {
    "id": 1,
    "message": "You have a new message.",
    "is_read": false,
    "created_at": "2025-04-17T12:34:56Z"
  }
]
```

###  Get a Single Notification

Gets one notification for the currently authenticated user for a given notification id.

- **URL**: `/notifications/{notification_id}/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body**: None

**Response**:


- **Success (200 OK)**
 ```json
{
  "id": 1,
  "message": "You have a new message.",
  "is_read": false,
  "created_at": "2025-04-17T12:34:56Z"
}
```

- **Error(400 Bad Request)**
 ```json
{
  "error": "Notification not found."
}
```

### Marking a Notification as Read
Marks one notification for the currently authenticated user as read for a given notification id.

- **URL**: `/notifications/{notification_id}/mark-as-read/`
- **Method**: `PATCH`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body**: None

**Response**:


- **Success (200 OK)**
 ```json
{
  "message": "Notification marked as read"
}

```

- **Error(400 Bad Request)**
 ```json
{
  "error": "Notification not found."
}
```

### Marking all Notifications as Read
Marks all notifications as read for the currently authenticated user.

- **URL**: `/notifications/mark-all-as-read/`
- **Method**: `PATCH`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body**: None

**Response**:


- **Success (200 OK)**
 ```json
{
  "message": "Notifications marked as read"
}
```




## Authentication Notes

1. Email verification is required before a user can log in.
2. Coach users can upload a verification file during registration.
3. Session duration depends on the "remember_me" parameter:
   - If true: Session lasts for 2 weeks (1,209,600 seconds)
   - If false: Session expires when the browser is closed

## Error Responses

The API returns validation errors with appropriate HTTP status codes and descriptive messages.