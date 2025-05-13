
# Mentor-Mentee API Documentation

This document provides comprehensive details about the Mentor-Mentee API for front-end integration.

## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Table of Contents

- [Authentication](#authentication)
- [Endpoints Overview](#endpoints-overview)
- [Detailed Endpoint Documentation](#detailed-endpoint-documentation)
  - [Send Mentor Request](#send-mentor-request)
  - [Send Mentee Request](#send-mentee-request)
  - [List Mentor-Mentee Requests](#list-mentor-mentee-requests)
  - [Respond to Mentor-Mentee Request](#respond-to-mentor-mentee-request)
  - [View My Mentors](#view-my-mentors)
  - [View My Mentees](#view-my-mentees)
- [Models and Data Structures](#models-and-data-structures)
- [Error Handling](#error-handling)
- [Additional Notes](#additional-notes)

## Authentication

All endpoints require user authentication. Ensure that the user is logged in before making API requests.

## Endpoints Overview

| Method | Endpoint                                 | Description                                   |
|--------|------------------------------------------|-----------------------------------------------|
| POST   | `/api/requests/send/by-mentor/<int:mentee_id>/` | Mentor sends a mentorship request to a mentee |
| POST   | `/api/requests/send/by-mentee/<int:mentor_id>/` | Mentee sends a mentorship request to a mentor |
| GET    | `/api/requests/`                         | List all mentor-mentee requests               |
| POST   | `/api/requests/respond/<int:request_id>/` | Respond to a mentorship request               |
| GET    | `/api/my-mentors/`                       | View list of mentors for the authenticated user |
| GET    | `/api/my-mentees/`                       | View list of mentees for the authenticated user |

## Detailed Endpoint Documentation

### Send Mentor Request

**Endpoint:** `POST /api/requests/send/by-mentor/<int:mentee_id>/`

**Description:**

Allows a mentor to send a mentorship request to a specific mentee.

**Permissions:**

- Only users with mentor privileges can access this endpoint.

**Response:**

- **201 Created:** Request successfully created.
- **400 Bad Request:** Invalid mentee ID or request already exists.

**Example Response:**

```json
{
  "id": 1,
  "mentor": 3,
  "mentee": 5,
  "status": "PENDING",
  "created_at": "2025-05-13T14:30:00Z"
}
```

### Send Mentee Request

**Endpoint:** `POST /api/requests/send/by-mentee/<int:mentor_id>/`

**Description:**

Allows a mentee to send a mentorship request to a specific mentor.

**Permissions:**

- Only users with mentee privileges can access this endpoint.

**Response:**

- **201 Created:** Request successfully created.
- **400 Bad Request:** Invalid mentor ID or request already exists.

### List Mentor-Mentee Requests

**Endpoint:** `GET /api/requests/`

**Description:**

Lists all pending, accepted, and rejected mentor-mentee requests related to the authenticated user.

**Response:**

- **200 OK:** Returns a list of requests.

### Respond to Mentor-Mentee Request

**Endpoint:** `POST /api/requests/respond/<int:request_id>/`

**Request Body:**

```json
{
  "response": "ACCEPT"  // or "REJECT"
}
```

**Response:**

- **200 OK:** Response successfully saved.
- **404 Not Found:** Request does not exist or is not accessible.
- **400 Bad Request:** Invalid response value.

### View My Mentors

**Endpoint:** `GET /api/my-mentors/`

**Description:**

Returns a list of users who are confirmed mentors of the authenticated user.

**Example Response:**

```json
[
    {
        "id": 2,
        "username": "johndoe123",
        "email": "john.doe@example.com",
        "user_type": "Coach",
        "is_verified_coach": false
    }
]
```

### View My Mentees

**Endpoint:** `GET /api/my-mentees/`

**Description:**

Returns a list of users who are confirmed mentees of the authenticated user.

**Example Response:**

```json
[
    {
        "id": 2,
        "username": "johndoe123",
        "email": "john.doe@example.com",
        "user_type": "Coach",
        "is_verified_coach": false
    }
]
```

## Models and Data Structures

### User

- `id`: Integer
- `username`: String
- `email`: String
- `user_type`: `"Coach"` or `"Client"`
- `is_verified_coach`: Boolean

### MentorMenteeRequest

- `id`: Integer
- `mentor`: Integer (User ID)
- `mentee`: Integer (User ID)
- `status`: `"PENDING"`, `"ACCEPTED"`, or `"REJECTED"`
- `created_at`: DateTime

## Error Handling

API uses standard HTTP response codes:

- **400 Bad Request:** Invalid input or missing fields.
- **401 Unauthorized:** User must log in.
- **403 Forbidden:** User does not have permission.
- **404 Not Found:** Resource not found.
- **500 Internal Server Error:** Server-side issue.

## Additional Notes

- A user cannot be in a mentorship relation with the same user more than once.
- Only accepted requests are reflected in the "my-mentors" and "my-mentees" endpoints.
