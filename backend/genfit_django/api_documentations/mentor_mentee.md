# Mentor–Mentee API Documentation

This document describes the Mentor–Mentee relationship API and provides valid example requests for each endpoint.

## Base URL

All endpoints are relative to your base API URL (e.g., `http://127.0.0.1:8000/api/`).

## Authentication

- All endpoints require an authenticated user session.
- Obtain a session via `POST /api/login/` and include cookies with subsequent requests.

## Endpoints Overview

| Method | Endpoint                                           | Description |
|--------|-----------------------------------------------------|-------------|
| POST   | `/api/mentor-relationships/`                       | Create a new mentor–mentee relationship request |
| POST   | `/api/mentor-relationships/:id/status/`            | Change status: ACCEPTED, REJECTED, TERMINATED |
| GET    | `/api/mentor-relationships/user/`                  | List relationships for current user with optional filters |
| GET    | `/api/mentor-relationships/:id/`                   | Get relationship details if involved |

## Detailed Endpoint Documentation

### Create Mentor–Mentee Request

`POST /api/mentor-relationships/`

Creates a request. `sender` and `receiver` are inferred from the authenticated user.

- If the authenticated user is the `mentor` (Coach), `sender` becomes mentor and `receiver` becomes mentee.
- If the authenticated user is the `mentee` (User), `sender` becomes mentee and `receiver` becomes mentor.

Valid roles:
- `mentor` must be a user with `user_type="Coach"`
- `mentee` must be a user with `user_type="User"`

Request Body (Coach sending to User):
```json
{
  "mentor": 12,
  "mentee": 34
}
```

Request Body (User requesting a Coach):
```json
{
  "mentor": 12,
  "mentee": 34
}
```

Response (201 Created):
```json
{
  "id": 55,
  "sender": 12,
  "receiver": 34,
  "mentor": 12,
  "mentee": 34,
  "status": "PENDING",
  "sender_username": "coach12",
  "receiver_username": "user34",
  "mentor_username": "coach12",
  "mentee_username": "user34",
  "created_at": "2025-11-18T10:10:00Z",
  "updated_at": "2025-11-18T10:10:00Z"
}
```

Common Errors:
- 400 Bad Request if mentor is not a coach or mentee is not a user, or if a non-rejected relationship already exists between the pair.

### Change Relationship Status (Unified)

`POST /api/mentor-relationships/:id/status/`

Changes the status of an existing relationship.

Rules:
- `ACCEPTED`/`REJECTED`: only the `receiver` can change when current status is `PENDING`.
- `TERMINATED`: only the `mentor` or `mentee` can change when current status is `ACCEPTED`.
- Notifications are sent to the other party automatically.

Request Body (Accept request as receiver):
```json
{
  "status": "ACCEPTED"
}
```

Request Body (Reject request as receiver):
```json
{
  "status": "REJECTED"
}
```

Request Body (Terminate as mentor or mentee):
```json
{
  "status": "TERMINATED"
}
```

Response (200 OK):
```json
{
  "message": "Request accepted."
}
```

Example Responses:
- Accepted: `{ "message": "Request accepted." }`
- Rejected: `{ "message": "Request rejected." }`
- Terminated: `{ "message": "Relationship terminated." }`

Common Errors:
- 403 Forbidden if the authenticated user is not permitted for that action.
- 400 Bad Request if the current status does not allow the requested transition.

### List Current User’s Relationships (Optional Filters)

`GET /api/mentor-relationships/user/`

Returns relationships where the authenticated user is involved, with optional query filters.

Query Parameters:
- `status`: filter by status; comma-separated and case-insensitive. Valid values: `pending,accepted,rejected,terminated`.
- `as`: filter by exact role: `sender` | `receiver` | `mentor` | `mentee`.
- `scope`: grouped role filter:
  - `sender_receiver`: where user is sender or receiver
  - `mentor_mentee`: where user is mentor or mentee
  - `any` (default): any involvement

Examples:
- All relationships: `GET /api/mentor-relationships/user/`
- Only accepted ones: `GET /api/mentor-relationships/user/?status=accepted`
- Multiple statuses: `GET /api/mentor-relationships/user/?status=accepted,terminated`
- Exact role filter (you are mentor): `GET /api/mentor-relationships/user/?as=mentor`
- Grouped scope filter with status: `GET /api/mentor-relationships/user/?scope=mentor_mentee&status=accepted`

Response (200 OK):
```json
[
  {
    "id": 55,
    "sender": 12,
    "receiver": 34,
    "mentor": 12,
    "mentee": 34,
    "status": "ACCEPTED",
    "sender_username": "coach12",
    "receiver_username": "user34",
    "mentor_username": "coach12",
    "mentee_username": "user34",
    "created_at": "2025-11-18T10:10:00Z",
    "updated_at": "2025-11-18T10:12:00Z"
  }
]
```

### Get Relationship Detail

`GET /api/mentor-relationships/:id/`

Returns details of a relationship if the authenticated user is involved (sender, receiver, mentor, or mentee).

Response (200 OK):
```json
{
  "id": 55,
  "sender": 12,
  "receiver": 34,
  "mentor": 12,
  "mentee": 34,
  "status": "ACCEPTED",
  "sender_username": "coach12",
  "receiver_username": "user34",
  "mentor_username": "coach12",
  "mentee_username": "user34",
  "created_at": "2025-11-18T10:10:00Z",
  "updated_at": "2025-11-18T10:12:00Z"
}
```

Common Errors:
- 403 Forbidden if the authenticated user is not involved in the relationship.
- 404 Not Found if the relationship does not exist.

## Notes

- `sender` and `receiver` are read-only and inferred server-side.
- Duplicate mentor–mentee pairs are prevented unless the previous request was `REJECTED`.
- Notifications are emitted for new requests and status changes.

## Quick Test Flow

1. Login as a Coach and create a request:
   - `POST /api/mentor-relationships/`
   - Body: `{ "mentor": 12, "mentee": 34 }`
2. Login as the User (receiver) and accept it:
   - `POST /api/mentor-relationships/55/status/`
   - Body: `{ "status": "ACCEPTED" }`
3. Fetch accepted mentor/mentee relationships:
   - `GET /api/mentor-relationships/user/?scope=mentor_mentee&status=accepted`
4. Login as the User (mentee) and terminate:
   - `POST /api/mentor-relationships/55/status/`
   - Body: `{ "status": "TERMINATED" }`