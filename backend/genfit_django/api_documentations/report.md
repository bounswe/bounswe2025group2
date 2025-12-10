# API Documentation — Report Feature

This document outlines the API endpoints for handling user reports on various content types (forum threads, comments, subcomments, chats, profiles, etc.).

---

## Base URL
All endpoints are relative to your base URL (e.g., `http://127.0.0.1:8000/`).

---

## Authentication
- **Authentication Required:** Yes (User must be logged in)  
- **CSRF Protection:** Required for all POST requests via `X-CSRFToken` header

---

# Endpoints

---

## Submit Report
Creates a new content report.

**URL:** `POST /api/reports/`  
**Method:** POST  
**Auth Required:** Yes  
**CSRF Required:** Yes (`X-CSRFToken`)

### Request Body
```json
{
  "content_type": "THREAD",
  "object_id": 42,
  "reason": "spam",
  "description": "This thread contains promotional content"
}
```

### Fields
| Field         | Type    | Required | Allowed Values | Description |
|---------------|---------|----------|----------------|-------------|
| content_type  | string  | Yes      | CHAT, FORUM, THREAD, COMMENT, SUBCOMMENT, PROFILE, CHALLENGE, OTHER | Type of content being reported |
| object_id     | integer | Yes      | Positive integer | ID of the content object |
| reason        | string  | Yes      | spam, harassment, inappropriate, hate_speech, privacy, impersonation, other | Reason for reporting |
| description   | string  | No       | Max 2000 chars | Additional details |

---

## Content Types

| Type        | Description             | Example Object |
|-------------|-------------------------|----------------|
| CHAT        | Private chat messages   | Chat message ID |
| FORUM       | Forum category          | Forum ID |
| THREAD      | Forum thread            | Thread ID |
| COMMENT     | Thread comment          | Comment ID |
| SUBCOMMENT  | Comment reply           | Subcomment ID |
| PROFILE     | User profile            | User ID |
| CHALLENGE   | Challenge content       | Challenge ID |
| OTHER       | Other content types     | Custom |

---

## Report Reasons

| Reason        | Description |
|---------------|-------------|
| spam          | Unwanted promotional content |
| harassment    | Bullying or targeted harassment |
| inappropriate | Sexually explicit or offensive |
| hate_speech   | Discriminatory or hateful content |
| privacy       | Privacy violation / doxxing |
| impersonation | Pretending to be someone else |
| other         | Other issues |

---

# Responses

### Success (201 Created)
```json
{
  "status": "success",
  "message": "Report submitted successfully",
  "report_id": 15,
  "content_type": "THREAD",
  "object_id": 42,
  "reason": "spam",
  "submitted_at": "2024-01-15T10:30:00Z"
}
```

### Error (400 Bad Request)
```json
{
  "status": "error",
  "message": "Please correct the errors below.",
  "errors": {
    "content_type": ["Invalid content type. Valid options are: CHAT, FORUM, THREAD, COMMENT, SUBCOMMENT, PROFILE, CHALLENGE, OTHER"],
    "object_id": ["Object ID must be a positive integer"],
    "reason": ["Reason is required. Valid options are: spam, harassment, inappropriate, hate_speech, privacy, impersonation, other"]
  }
}
```

### Error (401 Unauthorized)
```json
{
  "status": "error",
  "message": "Authentication required to submit reports"
}
```

### Error (403 Forbidden)
```json
{
  "status": "error",
  "message": "You cannot report your own content"
}
```

### Error (409 Conflict — Duplicate Report)
```json
{
  "status": "error",
  "message": "You have already reported this content"
}
```

### Error (500 Internal Server Error)
```json
{
  "status": "error",
  "message": "An error occurred while processing your report"
}
```

---

# Get User Reports (Admin)

Retrieves all reports submitted by the current user.

**URL:** `GET /api/reports/my-reports/`  
**Method:** GET  
**Auth Required:** Yes  
**CSRF Required:** No  

### Query Parameters

| Parameter | Type    | Required | Default | Description |
|----------|---------|----------|---------|-------------|
| page     | int     | No       | 1       | Pagination page |
| limit    | int     | No       | 20      | Items per page |
| status   | string  | No       | All     | pending, reviewed, resolved, dismissed |
| content_type | string | No | All | Filter by content type |

### Response (200 OK)
```json
{
  "status": "success",
  "reports": [
    {
      "id": 15,
      "content_type": "THREAD",
      "object_id": 42,
      "reason": "spam",
      "description": "Promotional content",
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "content_preview": "Check out this amazing product...",
      "content_url": "/forum/thread/42"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

---

# Get Report Status

**URL:** `GET /api/reports/{report_id}/`  
**Method:** GET  
**Auth Required:** Yes (owner or admin)  
**CSRF Required:** No  

### Response (200 OK)
```json
{
  "status": "success",
  "report": {
    "id": 15,
    "content_type": "THREAD",
    "object_id": 42,
    "reason": "spam",
    "description": "Promotional content",
    "status": "reviewed",
    "admin_notes": "Content removed for violating spam policy",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T14:20:00Z",
    "resolved_at": "2024-01-16T14:20:00Z",
    "content_preview": "Check out this amazing product...",
    "action_taken": "content_removed"
  }
}
```

---

# Admin Endpoints

## List All Reports (Admin)

**URL:** `GET /admin/api/reports/`  
**Method:** GET  
**Auth Required:** Admin  
**CSRF Required:** No  

### Query Parameters

| Param       | Type | Description |
|-------------|------|-------------|
| status      | string | pending, reviewed, resolved, dismissed |
| content_type | string | Filter by content type |
| reporter_id | integer | Filter by reporter |
| date_from   | date | YYYY-MM-DD |
| date_to     | date | YYYY-MM-DD |
| page        | integer | Page number |
| limit       | integer | Default 50 |

### Response (200 OK)
```json
{
  "status": "success",
  "reports": [
    {
      "id": 15,
      "content_type": "THREAD",
      "object_id": 42,
      "reason": "spam",
      "description": "Promotional content",
      "status": "pending",
      "reporter": {
        "id": 100,
        "username": "john_doe",
        "email": "john@example.com"
      },
      "reported_content": {
        "id": 42,
        "title": "Amazing Product Offer",
        "content": "Check out this amazing product...",
        "author": "spammer_user",
        "url": "/forum/thread/42"
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "pages": 1
  }
}
```

---

## Update Report Status (Admin)

**URL:** `PATCH /admin/api/reports/{report_id}/`  
**Method:** PATCH  
**Auth Required:** Admin  
**CSRF Required:** Yes  

### Request Body
```json
{
  "status": "resolved",
  "admin_notes": "Content removed for violating spam policy",
  "action_taken": "content_removed"
}
```

### Fields
| Field       | Type   | Required | Allowed Values | Description |
|-------------|--------|----------|----------------|-------------|
| status      | string | Yes | reviewed, resolved, dismissed | New status |
| admin_notes | string | Yes (if resolved/dismissed) | max 1000 chars | Moderator notes |
| action_taken | string | No | warning_issued, content_removed, user_suspended, user_banned, no_action | Action taken |

### Response (200 OK)
```json
{
  "status": "success",
  "message": "Report updated successfully",
  "report": {
    "id": 15,
    "status": "resolved",
    "admin_notes": "Content removed for violating spam policy",
    "action_taken": "content_removed",
    "updated_at": "2024-01-16T14:20:00Z",
    "resolved_at": "2024-01-16T14:20:00Z",
    "resolved_by": {
      "id": 1,
      "username": "admin_user"
    }
  }
}
```

---

# Data Model

## Report Model

| Field        | Type               | Description | Constraints |
|--------------|--------------------|-------------|-------------|
| id           | Integer            | PK | Auto-increment |
| reporter     | ForeignKey(User)   | User who submitted | Cascade |
| content_type | CharField          | Type of content | Choices |
| object_id    | PositiveInt        | ID | > 0 |
| reason       | CharField          | Report reason | Choices |
| description  | Text              | Optional | max 2000 |
| status       | CharField          | Default pending | Choices |
| admin_notes  | Text              | Optional | max 1000 |
| action_taken | CharField          | Optional | Choices |
| created_at   | DateTime           | Auto |
| updated_at   | DateTime           | Auto |
| resolved_at  | DateTime           | Nullable |
| resolved_by  | ForeignKey(User)   | Admin | Nullable |

### Status Values
| Status     | Description |
|------------|-------------|
| pending    | Awaiting review |
| reviewed   | Under review |
| resolved   | Action taken |
| dismissed  | No action necessary |

### Indexes
- Composite: `(content_type, object_id)`
- `reporter_id`
- `status`
- `created_at`

---

# Example Usage

## React / TypeScript Example

```ts
// Submit report
const submitReport = async (reportData: {
  contentType: string;
  objectId: number;
  reason: string;
  description?: string;
}) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/reports/`;
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify({
      content_type: reportData.contentType,
      object_id: reportData.objectId,
      reason: reportData.reason,
      description: reportData.description || '',
    }),
    credentials: 'include',
  });
  
  return await response.json();
};

// Get user reports
const getUserReports = async (page = 1, status = '') => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  let url = `${baseUrl}/api/reports/my-reports/?page=${page}`;
  
  if (status) url += `&status=${status}`;
  
  const response = await fetch(url, { credentials: 'include' });
  return await response.json();
};
```

---

# cURL Examples

### Submit Report
```bash
curl -X POST http://localhost:8000/api/reports/ \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: your-csrf-token-here" \
  -H "Cookie: sessionid=your-session-id" \
  -d '{
    "content_type": "THREAD",
    "object_id": 42,
    "reason": "spam",
    "description": "This thread contains promotional content"
  }'
```

### Get User Reports
```bash
curl -X GET http://localhost:8000/api/reports/my-reports/?status=pending \
  -H "Cookie: sessionid=your-session-id"
```

### Admin — List All Reports
```bash
curl -X GET http://localhost:8000/admin/api/reports/?status=pending \
  -H "Cookie: sessionid=admin-session-id"
```

---

# Error Handling

| Status | Scenario | Response |
|--------|----------|----------|
| 201 | Success | JSON |
| 400 | Validation error | JSON |
| 401 | Unauthenticated | JSON |
| 403 | Forbidden | JSON |
| 404 | Not found | JSON |
| 409 | Duplicate report | JSON |
| 500 | Internal error | JSON |

---

# Notes

- **Rate Limit:** 10 reports / hour  
- **Duplicate Prevention:** Users cannot report same content twice  
- **Self Reporting:** Not allowed  
- **Content Validation:** Backend ensures content exists  
- **Notifications:** Sent when report resolved  
- **Moderation Queue:** Sorted by severity and date  
- **Retention:** 1 year  
- **Privacy:** Reporter hidden from reported user  
- **Audit Log:** All actions logged  
- **Export:** Admins can export CSV/JSON  

