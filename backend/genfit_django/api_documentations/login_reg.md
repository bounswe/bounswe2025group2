# API Documentation

This document outlines the API endpoints for
- user registration
- email verification
- login
- logout

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

### Delete Personal Data (RTBF) 🔒

Permanently deletes all personal data and the user account (Right to be Forgotten).

- **URL**: `/user/rtbf/`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Description**:

Deletes goals, forum content (threads, comments, subcomments, votes and their children), direct chats and messages, AI tutor chats/responses/messages, notifications, mentor relationships, challenges and participation progress, profile information that belongs to user; and the user account itself. This action is irreversible.

**Request Body**: None

**Response**:

- **Success (200 OK)**
  ```json
  {
    "detail": "User data deleted"
  }
  ```

- **Error (403 Forbidden)**
  ```json
  {
    "error": "Authentication required"
  }
  ```
