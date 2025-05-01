# Vote API Documentation

This document outlines the API endpoints for managing votes on forum content (threads, comments, and subcomments).

## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Authentication

All endpoints in this document require authentication. Please include a valid authentication token in the header.

## Models

### Vote Model
- `user`: ForeignKey to UserWithType (the voter)
- `content_type`: ForeignKey to ContentType (type of content being voted on)
- `object_id`: PositiveInteger (ID of the content being voted on)
- `vote_type`: String (UPVOTE or DOWNVOTE)
- `created_at`: DateTime (automatically set)
- `updated_at`: DateTime (automatically updated)

## Endpoints

### Create/Update Vote

Creates a new vote or updates an existing one for a specific content.

- **URL**: `/forum/vote/`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body**:
```json
{
    "content_type": "THREAD",
    "object_id": 123,
    "vote_type": "UPVOTE"
}
```

**Parameters**:

| Field         | Type    | Required | Description                                                                 | Valid Values                     |
|---------------|---------|----------|-----------------------------------------------------------------------------|----------------------------------|
| content_type  | string  | Yes      | Type of content being voted on                                              | "THREAD", "COMMENT", "SUBCOMMENT"|
| object_id     | integer | Yes      | ID of the specific content being voted on                                   | Any valid content ID             |
| vote_type     | string  | Yes      | Type of vote to cast                                                        | "UPVOTE", "DOWNVOTE"             |

**Response**:

- **Success (201 Created)**:
  ```json
  {
    "id": 1,
    "user": 123,
    "user_username": "johndoe",
    "content_type": "thread",
    "content_id": 123,
    "vote_type": "UPVOTE",
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:00:00Z"
  }
  ```

- **Errors**:
  - 400 Bad Request: Invalid content type or missing required fields
  - 404 Not Found: Content not found

### Get User's Vote Status

Retrieves a user's vote on a specific content item.

- **URL**: `/forum/vote/{content_type}/{object_id}/status/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**URL Parameters**:

| Parameter     | Type    | Required | Description                                                                 | Valid Values                     |
|---------------|---------|----------|-----------------------------------------------------------------------------|----------------------------------|
| content_type  | string  | Yes      | Type of content being checked                                               | "thread", "comment", "subcomment"|
| object_id     | integer | Yes      | ID of the specific content being checked                                    | Any valid content ID             |

**Response**:

- **Success (200 OK)**:
  ```json
  {
    "id": 1,
    "user": 123,
    "user_username": "johndoe",
    "content_type": "thread",
    "content_id": 123,
    "vote_type": "UPVOTE",
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:00:00Z"
  }
  ```

- **Errors**:
  - 404 Not Found: No vote exists for this user on the specified content

### Delete Vote

Removes a user's vote from a specific content item.

- **URL**: `/forum/vote/{content_type}/{object_id}/`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**URL Parameters**:

| Parameter     | Type    | Required | Description                                                                 | Valid Values                     |
|---------------|---------|----------|-----------------------------------------------------------------------------|----------------------------------|
| content_type  | string  | Yes      | Type of content being unvoted                                               | "thread", "comment", "subcomment"|
| object_id     | integer | Yes      | ID of the specific content being unvoted                                    | Any valid content ID             |

**Response**:

- **Success (204 No Content)**: Empty response body
- **Errors**:
  - 404 Not Found: No vote exists for this user on the specified content

## Notes

1. The voting system automatically updates the `like_count` on the target content (thread, comment, or subcomment) when votes are created, updated, or deleted.
2. Each user can only have one vote per content item. Subsequent votes on the same content will update the existing vote.
3. The content type in URL parameters should be lowercase (e.g., "thread"), while in the request body it should be uppercase (e.g., "THREAD").
