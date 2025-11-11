# Forum and Thread API Documentation

This document provides comprehensive details about the Forum and Thread API for front-end integration.

## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Table of Contents
- [Authentication](#authentication)
- [Endpoints Overview](#endpoints-overview)
- [Detailed Endpoint Documentation](#detailed-endpoint-documentation)
  - [Forums](#forums)
  - [Threads](#threads)
- [Models and Data Structures](#models-and-data-structures)
- [Error Handling](#error-handling)
- [Additional Notes](#additional-notes)

## Authentication

Most endpoints require authentication. Include the authentication token in the request header:
```
Authorization: Bearer your_token_here
```

## Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/forums/` | List all forums | No |
| POST | `/api/forums/` | Create a new forum | Yes (Admin only) |
| GET | `/api/forums/:id/` | Get forum details | No |
| PUT | `/api/forums/:id/` | Update forum | Yes (Admin only) |
| DELETE | `/api/forums/:id/` | Delete forum | Yes (Admin only) |
| GET | `/api/forums/:id/threads/` | List threads in forum | No |
| GET | `/api/threads/` | List all threads | No |
| POST | `/api/threads/` | Create a new thread | Yes |
| GET | `/api/threads/:id/` | Get thread details | No |
| PUT | `/api/threads/:id/` | Update thread | Yes (Author only) |
| DELETE | `/api/threads/:id/` | Delete thread | Yes (Author only) |

## Detailed Endpoint Documentation

### Forums

#### `GET /api/forums/`

Lists all available forums.

**Response (200 OK)**
```json
[
  {
    "id": 1,
    "title": "Workout Tips",
    "description": "Share and discuss workout techniques",
    "created_at": "2025-04-24T10:00:00Z",
    "updated_at": "2025-04-24T10:00:00Z",
    "created_by": "admin",
    "is_active": true,
    "order": 1,
    "thread_count": 5
  }
]
```

#### `POST /api/forums/` (Admin Only)

Creates a new forum.

**Request Body**
```json
{
  "title": "Nutrition Advice",
  "description": "Discuss healthy eating habits",
  "order": 2,
  "is_active": true
}
```

**Response (201 Created)**
```json
{
  "id": 2,
  "title": "Nutrition Advice",
  "description": "Discuss healthy eating habits",
  "created_at": "2025-04-24T11:00:00Z",
  "updated_at": "2025-04-24T11:00:00Z",
  "created_by": "admin",
  "is_active": true,
  "order": 2,
  "thread_count": 0
}
```

### Threads

#### `GET /api/threads/`

Lists all threads across all forums.

**Response (200 OK)**
```json
[
  {
    "id": 1,
    "title": "Best exercises for beginners",
    "author": "john_doe",
    "forum": "Workout Tips",
    "created_at": "2025-04-24T12:00:00Z",
    "updated_at": "2025-04-24T12:00:00Z",
    "is_pinned": false,
    "is_locked": false,
    "view_count": 10,
    "like_count": 5,
    "comment_count": 3,
    "last_activity": "2025-04-24T14:30:00Z"
  }
]
```

#### `POST /api/threads/`

Creates a new thread in a forum.

**Request Body**
```json
{
  "forum": 1,
  "title": "Need advice on protein intake",
  "content": "What's the recommended daily protein intake for muscle building?",
  "is_pinned": false,
  "is_locked": false
}
```

**Response (201 Created)**
```json
{
  "id": 2,
  "title": "Need advice on protein intake",
  "content": "What's the recommended daily protein intake for muscle building?",
  "author": "current_user",
  "forum": {
    "id": 1,
    "title": "Nutrition Advice",
    "description": "Discuss healthy eating habits"
  },
  "created_at": "2025-04-24T15:00:00Z",
  "updated_at": "2025-04-24T15:00:00Z",
  "is_pinned": false,
  "is_locked": false,
  "view_count": 0,
  "like_count": 0,
  "comment_count": 0,
  "last_activity": "2025-04-24T15:00:00Z"
}
```

#### `PUT /api/threads/:id/`

Updates an existing thread. Only the thread author can update their thread.

**Request Body**
```json
{
  "forum": 1,
  "title": "Updated: Need advice on protein intake",
  "content": "What's the recommended daily protein intake for muscle building? Updated with more details.",
  "is_pinned": false,
  "is_locked": false
}
```

**Response (200 OK)**
```json
{
  "id": 2,
  "title": "Updated: Need advice on protein intake",
  "content": "What's the recommended daily protein intake for muscle building? Updated with more details.",
  "author": "current_user",
  "forum": 1,
  "created_at": "2025-04-24T15:00:00Z",
  "updated_at": "2025-04-24T16:30:00Z",
  "is_pinned": false,
  "is_locked": false,
  "view_count": 5,
  "like_count": 2,
  "comment_count": 1,
  "last_activity": "2025-04-24T16:30:00Z"
}
```

**Error Response (403 Forbidden)**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

#### `DELETE /api/threads/:id/`

Deletes a thread. Only the thread author can delete their thread. This will cascade delete all associated comments, subcomments, and votes.

**Response (204 No Content)**
```json
{
  "message": "Thread deleted successfully"
}
```

**Error Response (403 Forbidden)**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**Error Response (404 Not Found)**
```json
{
  "detail": "Not found."
}
```

## Models and Data Structures

### Forum Model

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique identifier for the forum |
| title | String | The title of the forum |
| description | String | Detailed description of the forum |
| created_at | DateTime | When the forum was created |
| updated_at | DateTime | When the forum was last updated |
| created_by | Integer | User ID of the admin who created the forum |
| is_active | Boolean | Whether the forum is active |
| order | Integer | Display order of the forum |

### Thread Model

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Unique identifier for the thread |
| forum | Integer | ID of the forum this thread belongs to |
| title | String | The title of the thread |
| content | Text | The main content of the thread |
| author | Integer | User ID of the thread creator |
| created_at | DateTime | When the thread was created |
| updated_at | DateTime | When the thread was last updated |
| is_pinned | Boolean | Whether the thread is pinned to the top |
| is_locked | Boolean | Whether the thread is locked for new responses |
| view_count | Integer | Number of times the thread has been viewed |
| like_count | Integer | Number of likes on the thread |
| comment_count | Integer | Number of comments on the thread |
| last_activity | DateTime | When the last activity occurred on the thread |

## Error Handling

The API returns standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error responses include a message explaining what went wrong:

```json
{
  "error": "Detailed error message here"
}
```

## Additional Notes

1. Forums can only be created and managed by admin users
2. Regular users can:
   - View forums and threads
   - Create threads in any active forum
   - View thread details
   - Edit their own threads
   - Delete their own threads
3. Thread view count is automatically incremented when viewing thread details
4. The `last_activity` field is updated whenever there's any interaction with the thread
5. Threads are ordered by pinned status first, then by last activity
6. When a thread is deleted, all associated comments, subcomments, and votes are automatically deleted (cascade delete)
7. Only the thread author can edit or delete their thread - admins cannot modify user threads 