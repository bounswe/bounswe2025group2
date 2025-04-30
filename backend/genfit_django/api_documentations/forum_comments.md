
# API Documentation

This document outlines the API endpoints for:
- Adding, retrieving, updating, and deleting comments
- Fetching comments sorted by date or likes
- Adding, retrieving, updating, and deleting subcomments
- Fetching subcomments sorted by date or likes

Note that each post has some certain amount of comments and each comments has a certain amount of subcomments (0 included)
Subcomments do not have any Subcomments

## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Authentication

All endpoints assume user authentication is handled globally or elsewhere in your project.

## Endpoints

### Add Comment

Creates a new comment under a thread.

- **URL**: `/comments/add/{thread_id}/`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body**:

```json
{
  "content": "This is a comment"
}
```

| Field   | Type   | Required | Description              |
|---------|--------|----------|--------------------------|
| content | string | Yes      | The body of the comment  |

**Response**:

- **Success (201 Created)**: Returns the newly created comment object.
- **Error (400 Bad Request)**: Validation errors in the submitted data.

---

### Delete Comment

Deletes an existing comment.

- **URL**: `/comments/delete/{comment_id}/`
- **Method**: `DELETE`
- **Auth Required**: Yes

**Response**:

- **Success (204 No Content)**

```json
{
  "message": "Comment deleted successfully"
}
```

- **Error (404 Not Found)**: Comment does not exist.

---

### Update Comment

Fully updates an existing comment.

- **URL**: `/comments/update/{comment_id}/`
- **Method**: `PUT`
- **Auth Required**: Yes

**Request Body**:

```json
{
  "content": "Updated comment content"
}
```

**Response**:

- **Success (200 OK)**: Updated comment object.
- **Error (400 Bad Request)**: Validation failed.

---

### Get Comment

Fetches a specific comment by ID.

- **URL**: `/comments/{comment_id}/`
- **Method**: `GET`
- **Auth Required**: No

**Response**:

- **Success (200 OK)**: Returns the comment object.
- **Error (404 Not Found)**: Comment does not exist.

---

### Get All Comments for Thread (by Date)

Returns all comments for a given thread, sorted by creation time (ascending).

- **URL**: `/comments/thread/{thread_id}/date/`
- **Method**: `GET`
- **Auth Required**: No

**Response**:

- **Success (200 OK)**: Returns a list of comments.

---

### Get All Comments for Thread (by Likes)

Returns all comments for a given thread, sorted by like count (descending).

- **URL**: `/comments/thread/{thread_id}/likes/`
- **Method**: `GET`
- **Auth Required**: No

**Response**:

- **Success (200 OK)**: Returns a list of comments.

---

### Add Subcomment

Creates a new subcomment under a comment.

- **URL**: `/subcomments/add/{comment_id}/`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body**:

```json
{
  "content": "This is a subcomment"
}
```

**Response**:

- **Success (201 Created)**: Returns the created subcomment object.
- **Error (400 Bad Request)**: Validation error.

---

### Delete Subcomment

Deletes a specific subcomment.

- **URL**: `/subcomments/delete/{subcomment_id}/`
- **Method**: `DELETE`
- **Auth Required**: Yes

**Response**:

- **Success (204 No Content)**

```json
{
  "message": "Subcomment deleted successfully"
}
```

- **Error (404 Not Found)**: Subcomment does not exist.

---

### Update Subcomment

Fully updates a specific subcomment.

- **URL**: `/subcomments/update/{subcomment_id}/`
- **Method**: `PUT`
- **Auth Required**: Yes

**Request Body**:

```json
{
  "content": "Updated subcomment"
}
```

**Response**:

- **Success (200 OK)**: Updated subcomment object.
- **Error (400 Bad Request)**: Validation error.

---

### Get Subcomment

Fetches a specific subcomment by ID.

- **URL**: `/subcomments/{subcomment_id}/`
- **Method**: `GET`
- **Auth Required**: No

**Response**:

- **Success (200 OK)**: Returns the subcomment object.
- **Error (404 Not Found)**: Subcomment does not exist.

---

### Get All Subcomments for Comment (by Date)

Returns all subcomments for a given comment, sorted by creation time (ascending).

- **URL**: `/subcomments/comment/{comment_id}/date/`
- **Method**: `GET`
- **Auth Required**: No

**Response**:

- **Success (200 OK)**: List of subcomments.

---

### Get All Subcomments for Comment (by Likes)

Returns all subcomments for a given comment, sorted by like count (descending).

- **URL**: `/subcomments/comment/{comment_id}/likes/`
- **Method**: `GET`
- **Auth Required**: No

**Response**:

- **Success (200 OK)**: List of subcomments.
