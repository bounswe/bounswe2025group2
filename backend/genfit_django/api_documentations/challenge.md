
# Challenge API Documentation

This document outlines the API endpoints for:
- Creating, updating, deleting challenges
- Joining/leaving challenges
- Updating progress
- Fetching challenge details and leaderboard

## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Authentication

All endpoints require user authentication.

## Endpoints

### Get Challenge Detail

- **URL**: `/challenges/{challenge_id}/`
- **Method**: `GET`
- **Auth Required**: Yes

**Response**:
- **Success (200 OK)**:
```json
{
  "joined": true,
  "challenge": { ... },
  "participant": { ... }
}
```
or
```json
{
  "joined": false,
  "challenge": { ... }
}
```

depending on whether you joined the challenge or not

---

### Create Challenge

- **URL**: `/challenges/create/`
- **Method**: `POST`
- **Auth Required**: Yes (Coach only)

**Request Body**:
```json
{
  "title": "10K Step Challenge",
  "description": "Walk 10,000 steps daily for better health.",
  "challenge_type": "Step Count",
  "target_value": 10000,
  "unit": "steps",
  "location": "Central Park",
  "longitude": -73.9654,
  "latitude": 40.7829,
  "start_date": "2025-06-01T00:00:00Z",
  "end_date": "2025-06-30T23:59:59Z",
  "min_age": 18,
  "max_age": 65
}
```

**Fields:**

| Field            | Type     | Required | Description                                         |
| ---------------- | -------- | -------- | --------------------------------------------------- |
| `title`          | string   | Yes      | Name of the challenge                               |
| `description`    | string   | No       | Description of the challenge                        |
| `challenge_type` | string   | Yes      | Type/category of the challenge (e.g., "Step Count") |
| `target_value`   | float    | Yes      | Goal value participants must reach                  |
| `unit`           | string   | Yes      | Measurement unit (e.g., steps, km, minutes)         |
| `location`       | string   | No       | Optional location description                       |
| `longitude`      | float    | No       | Longitude coordinate                                |
| `latitude`       | float    | No       | Latitude coordinate                                 |
| `start_date`     | datetime | Yes      | ISO 8601 format (e.g., `2025-06-01T00:00:00Z`)      |
| `end_date`       | datetime | Yes      | ISO 8601 format (e.g., `2025-06-30T23:59:59Z`)      |
| `min_age`        | integer  | No       | Optional minimum age restriction                    |
| `max_age`        | integer  | No       | Optional maximum age restriction                    |

**Note:** The longtitude and latitude will be automatically calculated via location by using an external API ("https://nominatim.openstreetmap.org/search"). 
However other fields that are not required will remain blank or null if not provided in request body.
Ages are not exception to this rule since the challenge may not have an age restriction

**Response**:
- **Success (201 Created)**: Created challenge object
- **Error (403 Forbidden)**: User is not a coach
- **Error (400 Bad Request)**: Validation errors

---

Note:

### Update Challenge

- **URL**: `/challenges/update/{challenge_id}/`
- **Method**: `PUT`
- **Auth Required**: Yes (Coach who created the challenge only)

**Request Body**:
```json
{
  "title": "Updated Challenge Name",
  "description": "New description of the challenge.",
  "challenge_type": "Step Count",
  "target_value": 15000,
  "unit": "steps",
  "location": "Updated Park Location",
  "longitude": -73.9700,
  "latitude": 40.7800,
  "start_date": "2025-06-05T00:00:00Z",
  "end_date": "2025-07-05T23:59:59Z",
  "min_age": 21,
  "max_age": 60
}
```
**Note:** Any information that is not provided will remain as it is. The only exceptions are longitude and latitude which can be updated via an external geocoding api by using location information.

**Response**:
- **Success (200 OK)**: Updated challenge object
- **Error (403 Forbidden)**: Not the owner
- **Error (400 Bad Request)**: Validation failed

---

### Delete Challenge

- **URL**: `/challenges/delete/{challenge_id}/`
- **Method**: `DELETE`
- **Auth Required**: Yes (Coach who created the challenge only)

**Response**:
- **Success (204 No Content)**:
```json
{
  "detail": "Challenge deleted successfully."
}
```

---

### Join Challenge

- **URL**: `/challenges/join/{challenge_id}/`
- **Method**: `POST`
- **Auth Required**: Yes

**Response**:
- **Success (201 Created)**:
```json
{
  "detail": "Successfully joined the challenge!"
}
```

- **Error (400 Bad Request)**: Already joined
- **Error (403 Forbidden)**: Challenge is not active

---

### Leave Challenge

- **URL**: `/challenges/leave/{challenge_id}/`
- **Method**: `POST`
- **Auth Required**: Yes

**Response**:
- **Success (204 No Content)**:
```json
{
  "detail": "Successfully left the challenge."
}
```

- **Error (400 Bad Request)**: Not a participant

---

### Update Progress

- **URL**: `/challenges/progress/{challenge_id}/`
- **Method**: `POST`
- **Auth Required**: Yes

**Request Body**:
```json
{
  "added_value": 10
}
```
which will add 10 to the current_value

or 

```json
{
  "current_value": 10
}
```
which will equilize current value to 10

**Note:** Sending a request with both current_value and added_value fields will result their sum to be saved.

**Response**:
- **Success (200 OK)**:
```json
{
  "detail": "Progress updated successfully!"
}
```

- **Error (400 Bad Request)**: Not a participant 
- **Error (403 Forbidden)**: Challenge not active

---

### Challenge Leaderboard

- **URL**: `/challenges/leaderboard/{challenge_id}/`
- **Method**: `GET`
- **Auth Required**: Yes

**Optional Query Params**:
- `progress=`
- `finish_date=`
- `joined_at=`
- `username=`
(Use `-` to reverse the order)

**Response**:
- **Success (200 OK)**: List of participants ordered by specified fields
