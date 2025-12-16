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

- The authenticated user must be either the `mentor` or the `mentee`.
- If the authenticated user is the `mentor`, `sender` becomes mentor and `receiver` becomes mentee.
- If the authenticated user is the `mentee`, `sender` becomes mentee and `receiver` becomes mentor.

Valid roles:
- Any authenticated user can be `mentor` or `mentee`.

Request Body:
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
  "sender_username": "userA",
  "receiver_username": "userB",
  "mentor_username": "userA",
  "mentee_username": "userB",
  "created_at": "2025-11-18T10:10:00Z",
  "updated_at": "2025-11-18T10:10:00Z"
}
```

Common Errors:
- 400 Bad Request if mentor and mentee are the same user.
- 400 Bad Request if the authenticated user is neither the mentor nor the mentee.
- 400 Bad Request if a non-rejected relationship already exists between the pair.

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
- `as`: filter among request roles: `sender` | `receiver`.
- `role`: filter among relationship roles: `mentor` | `mentee`.
Default when filters are omitted: any involvement (sender/receiver/mentor/mentee).

Examples:
- All relationships: `GET /api/mentor-relationships/user/`
- Only accepted ones: `GET /api/mentor-relationships/user/?status=accepted`
- Multiple statuses: `GET /api/mentor-relationships/user/?status=accepted,terminated`
- Filter as sender: `GET /api/mentor-relationships/user/?as=sender`
- Filter as mentor: `GET /api/mentor-relationships/user/?role=mentor`
- Combine filters: `GET /api/mentor-relationships/user/?as=receiver&role=mentee&status=pending`

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
    "sender_username": "userA",
    "receiver_username": "userB",
    "mentor_username": "userA",
    "mentee_username": "userB",
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
    "sender_username": "userA",
    "receiver_username": "userB",
    "mentor_username": "userA",
    "mentee_username": "userB",
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

1. Login as User A and create a request:
   - `POST /api/mentor-relationships/`
   - Body: `{ "mentor": 12, "mentee": 34 }`
2. Login as User B (receiver) and accept it:
   - `POST /api/mentor-relationships/55/status/`
   - Body: `{ "status": "ACCEPTED" }`
3. Fetch accepted mentor/mentee relationships:
   - `GET /api/mentor-relationships/user/?scope=mentor_mentee&status=accepted`
4. Login as User B (mentee) and terminate:
   - `POST /api/mentor-relationships/55/status/`
   - Body: `{ "status": "TERMINATED" }`