# API Documentation --- Contact Form

This document outlines the API endpoints for handling contact form
submissions.

## Base URL

All endpoints are relative to your base URL (for example:
`http://127.0.0.1:8000/`).

## Authentication

-   No authentication required for submitting contact forms.\
-   Admin endpoints require Django admin authentication.

------------------------------------------------------------------------

## Endpoints

### Submit Contact Form

Creates a new contact form submission.

-   **URL:** `POST /contact/`\
-   **Method:** `POST`\
-   **Auth Required:** No\
-   **CSRF Required:** Yes (via `X-CSRFToken` header)

#### Request Body

``` json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Website Feedback",
  "message": "I wanted to provide some feedback about your website..."
}
```

#### Fields

  --------------------------------------------------------------------------------
      Field   Type    Required  Constraints        Description
  --------- -------- ---------- ------------------ -------------------------------
       name  string     Yes     `min_length: 2`    Full name of the person

      email  string     Yes     valid email format Email address for response

    subject  string     Yes     `min_length: 5`    Brief subject of the message

    message  string     Yes     `min_length: 10`   Detailed message content
  --------------------------------------------------------------------------------

#### Responses

**Success (201 Created)**

``` json
{
  "status": "success",
  "message": "Thank you for your message! We will get back to you soon.",
  "submission_id": 42
}
```

**Error (400 Bad Request) --- Validation failed**

``` json
{
  "status": "error",
  "message": "Please correct the errors below.",
  "errors": {
    "name": ["Name must be at least 2 characters long."],
    "email": ["Enter a valid email address."],
    "subject": ["Subject must be at least 5 characters long."],
    "message": ["Message must be at least 10 characters long."]
  }
}
```

**Error (500 Internal Server Error)**

``` json
{
  "status": "error",
  "message": "An error occurred while processing your request."
}
```

------------------------------------------------------------------------

### Get Contact Submissions (Admin)

Retrieves all contact form submissions (Admin only).

-   **URL:** `/admin/api/contactsubmission/` (Django Admin)\
-   **Method:** `GET` (via Django Admin interface)\
-   **Auth Required:** Yes (Django admin credentials)

#### Features in Admin Panel

-   List view with: Name, Email, Subject, Submission Date\
-   Search by: Name, Email, Subject, Message content\
-   Filter by: Submission date\
-   Read-only view of individual submissions\
-   No editing capabilities (submissions are immutable)

#### Admin Response

-   Table view of all submissions\
-   Detailed view of individual messages\
-   Export capabilities (if configured)

------------------------------------------------------------------------

## Data Model

### ContactSubmission

  Field          Type         Description
  -------------- ------------ ----------------------------
  id             Integer      Auto-generated primary key
  name           Char(100)    Submitter's full name
  email          EmailField   Submitter's email address
  subject        Char(200)    Message subject
  message        Text         Detailed message content
  submitted_at   DateTime     Auto-generated timestamp

------------------------------------------------------------------------

## Example Usage

### Frontend Implementation (JavaScript)

``` javascript
// Submit contact form
const submitContactForm = async (formData) => {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const response = await fetch(new URL('/contact/', base).toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken(), // From cookie
    },
    body: JSON.stringify(formData),
    credentials: 'include',
  });

  return await response.json();
};
```

### cURL Example

``` bash
curl -X POST http://localhost:8000/contact/   -H "Content-Type: application/json"   -H "X-CSRFToken: your-csrf-token-here"   -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "subject": "Partnership Inquiry",
    "message": "I am interested in exploring partnership opportunities with your company."
  }'
```

------------------------------------------------------------------------

## Error Handling

  -----------------------------------------------------------------------
  Status Code  Scenario                            Response Format
  ------------ ----------------------------------- ----------------------
  201          Successfully created submission     JSON success object

  400          Validation error in request data    JSON with error detail

  404          Endpoint not found                  HTML 404 page

  405          Method not allowed                  HTML 405 page

  500          Internal server error               JSON error message
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Notes

-   **CSRF Protection:** All POST requests require a valid CSRF token\
-   **CORS Enabled:** Configured for cross-origin requests from your
    frontend\
-   **Data Retention:** Submissions stored indefinitely\
-   **Admin Access:** Only admin users can view submissions\
-   **Read-Only:** Submissions cannot be modified or deleted via API\
-   **Response Time:** Backend typically responds within 100--500ms
