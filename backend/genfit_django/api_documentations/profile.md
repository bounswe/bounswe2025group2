
# Profile API Documentation

This document outlines the API endpoints for managing user profiles.

## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Authentication

All endpoints in this document require authentication, unless otherwise specified. Please include a valid authentication token in the header.

## Endpoints

### Get Profile Details 🔒

Fetches the authenticated user's profile information.

- **URL**: `/profile/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Response**:

- **Success (200 OK)**
  ```json
  {
    "username": "johndoe123",
    "bio": "This is my bio.",
    "location": "New York, USA",
    "birth_date": "1990-01-01",
    "age": 31,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-05-01T00:00:00Z"
  }
  ```

### Update Profile Details 🔒

Updates the authenticated user's profile information (bio, location, etc.).

- **URL**: `/profile/`
- **Method**: `PUT`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body**:

```json
{
  "bio": "Updated bio content",
  "location": "San Francisco, USA",
  "birth_date": "1990-01-01"
}
```

| Field       | Type    | Required | Description                                      |
|-------------|---------|----------|--------------------------------------------------|
| bio         | string  | Yes      | User's biography or personal description         |
| location    | string  | Yes      | User's location                                  |
| birth_date  | string  | Yes      | User's birth date in format "YYYY-MM-DD"         |

**Response**:

- **Success (200 OK)**
  ```json
  {
    "message": "Profile updated successfully"
  }
  ```

### Upload Profile Picture 🔒

Uploads a profile picture for the authenticated user.

- **URL**: `/profile/picture/upload/`
- **Method**: `POST`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Request Body** (Multipart/Form-Data):

| Field              | Type   | Required | Description                          |
|--------------------|--------|----------|--------------------------------------|
| profile_picture    | file   | Yes      | The image file to upload (max 5MB)   |

**Response**:

- **Success (200 OK)**
  ```json
  {
    "message": "Profile picture uploaded successfully"
  }
  ```

### Get Profile Picture 🔒

Fetches the authenticated user's profile picture.

- **URL**: `/profile/picture/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Response**:

- **Success (200 OK)**
  ```json
  {
    "image": "image_data"
  }
  ```

### Delete Profile Picture 🔒

Deletes the authenticated user's profile picture and reverts to a default one.

- **URL**: `/profile/picture/delete/`
- **Method**: `DELETE`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**Response**:

- **Success (200 OK)**
  ```json
  {
    "message": "Profile picture removed and reverted to default"
  }
  ```

### Get Other User's Profile 🔒

Fetches a specified user's profile by their username.

- **URL**: `/profile/other/{username}/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**URL Parameters**:

| Parameter  | Description                |
|------------|----------------------------|
| username   | The username of the target user |

**Response**:

- **Success (200 OK)**
  ```json
  {
    "username": "janedoe123",
    "bio": "Jane's bio",
    "location": "Los Angeles, USA",
    "birth_date": "1992-05-12",
    "age": 28,
    "created_at": "2023-03-01T00:00:00Z",
    "updated_at": "2023-04-01T00:00:00Z"
  }
  ```

### Get Other User's Profile Picture 🔒

Fetches a specified user's profile picture by their username.

- **URL**: `/profile/other/picture/{username}/`
- **Method**: `GET`
- **Auth Required**: Yes
- **Permissions**: IsAuthenticated

**URL Parameters**:

| Parameter  | Description                |
|------------|----------------------------|
| username   | The username of the target user |

**Response**:

- **Success (200 OK)**
  ```json
  {
    "image": "image_data"
  }
  ```

