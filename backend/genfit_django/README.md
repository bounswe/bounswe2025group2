# API Documentation

This document outlines the API endpoints for
- user registration
- email verification
- login
- logout
- getting a notification and getting all notifications
- marking a notification as read and marking all notifications as read
- changing the password for an authenticated user
- Deleting the account for an authenticated user


## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Authentication

Most endpoints are public and don't require authentication. Endpoints that require authentication are marked with 🔒.

## Endpoints

### Register User

Creates a new user account and sends a verification email.

- **URL**: `/register/`
- **Method**: `POST`
- **Auth Required**: No
- **Permissions**: AllowAny

**Request Body**:

```json
{
  "username": "johndoe123",
  "email": "john.doe@example.com",
  "password": "securepassword",
  "user_type": "User/Coach",
  "verification_file": "",
  "remember_me": false
}
```

| Field             | Type    | Required | Description                                                           |
|-------------------|---------|----------|-----------------------------------------------------------------------|
| username          | string  | Yes      | Must start with lowercase letter and contain at least one digit and one letter |
| email             | string  | Yes      | Valid email address                                                   |
| password          | string  | Yes      | User's password                                                       |
| user_type         | string  | Yes      | Type of user (e.g., "Regular", "Coach")                               |
| verification_file | string  | No       | For coach verification (optional)                                     |
| remember_me       | boolean | No       | Whether to remember the user (defaults to false)                      |

**Response**:

- **Success (201 Created)**
  ```json
  {
    "message": "Registration successful. Please check your email to verify your account.",
    "user_id": 123
  }
  ```

- **Error (400 Bad Request)**
  ```json
  {
    "username": ["Username must start with a lowercase letter and contain at least one digit and one letter"],
    "email": ["Enter a valid email address."]
  }
  ```

### Verify Email

Verifies a user's email address using the provided token.

- **URL**: `/verify-email/{uidb64}/{token}/`
- **Method**: `GET`
- **Auth Required**: No
- **Permissions**: AllowAny

**URL Parameters**:

| Parameter | Description                                       |
|-----------|---------------------------------------------------|
| uidb64    | Base64 encoded user ID (auto-generated)           |
| token     | Verification token sent in email (auto-generated) |

**Response**:

- **Success (200 OK)**
  ```json
  {
    "message": "Email verified successfully"
  }
  ```

- **Error (400 Bad Request)**
  ```json
  {
    "error": "Invalid verification link"
  }
  ```

### Login

Authenticates a user and creates a session.

- **URL**: `/login/`
- **Method**: `POST`
- **Auth Required**: No
- **Permissions**: AllowAny

**Request Body**:

```json
{
  "username": "johndoe123",
  "password": "securepassword",
  "remember_me": true
}
```

| Field       | Type    | Required | Description                                    |
|-------------|---------|----------|------------------------------------------------|
| username    | string  | Yes      | User's username                                |
| password    | string  | Yes      | User's password                                |
| remember_me | boolean | No       | If true, session lasts for 2 weeks (default: false) |

**Response**:

- **Success (200 OK)**
  ```json
  {
    "message": "Login successful"
  }
  ```

- **Error (400 Bad Request)**
  ```json
  {
    "error": "Invalid credentials"
  }
  ```

  OR

  ```json
  {
    "error": "Please verify your email first"
  }
  ```

### Logout 🔒

Logs out the currently authenticated user.

- **URL**: `/logout/`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body**: None

**Response**:

- **Success (200 OK)**
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

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

### Change Password

Allows an authenticated user to change their password.

- **URL**: `/change-password/`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body**:

```json
{
  "old_password": "currentPassword",
  "new_password": "newSecurePassword"
}
```

| Field         | Type   | Required | Description                                |
|---------------|--------|----------|--------------------------------------------|
| old_password  | string | Yes      | The current password of the user           |
| new_password  | string | Yes      | The new password to be set for the account |

**Response**:

- **Success (200 OK)**
  ```json
  {
    "detail": "Password changed successfully."
  }
  ```

- **Error (400 Bad Request)**

  - Missing fields:
    ```json
    {
      "detail": "Both old and new passwords are required."
    }
    ```

  - Incorrect old password:
    ```json
    {
      "old_password": "Wrong password."
    }
    ```
    

### Delete Account

Deletes the currently authenticated user's account.

- **URL**: `/delete-account/`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body**: _None_


**Response**:

- **Success (204 No Content)**
  ```json
  {
    "detail": "Account deleted successfully."
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