# Forum Thread Edit/Delete Feature - Mobile Team Implementation Guide

## Overview
This document provides implementation details for the forum thread edit and delete functionality that has been added to the backend. The mobile team should implement corresponding features using these endpoints.

## Backend Implementation Status
✅ **COMPLETED** - Backend endpoints are ready for use

## API Endpoints

### 1. Update Thread (Edit)
**Endpoint:** `PUT /api/threads/{id}/`

**Authentication:** Required

**Authorization:** Only the thread author can update their thread

**Request Body:**
```json
{
  "forum": 1,
  "title": "Updated thread title",
  "content": "Updated thread content",
  "is_pinned": false,
  "is_locked": false
}
```

**Success Response (200 OK):**
```json
{
  "id": 2,
  "title": "Updated thread title",
  "content": "Updated thread content",
  "author": "username",
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

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User is not the thread author
  ```json
  {
    "detail": "You do not have permission to perform this action."
  }
  ```
- `404 Not Found` - Thread does not exist
  ```json
  {
    "detail": "Not found."
  }
  ```
- `400 Bad Request` - Invalid data (e.g., empty title or content)

### 2. Delete Thread
**Endpoint:** `DELETE /api/threads/{id}/`

**Authentication:** Required

**Authorization:** Only the thread author can delete their thread

**Request Body:** None

**Success Response (204 No Content):**
```json
{
  "message": "Thread deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User is not the thread author
  ```json
  {
    "detail": "You do not have permission to perform this action."
  }
  ```
- `404 Not Found` - Thread does not exist
  ```json
  {
    "detail": "Not found."
  }
  ```

## Important Notes

### Permission Logic
- **Only the thread author** can edit or delete their thread
- The backend checks if `request.user == thread.author`
- Admin users **cannot** edit or delete user threads (by design)

### Cascade Deletion
When a thread is deleted, the following are automatically deleted:
- All comments on the thread
- All subcomments on those comments
- All votes on the thread, comments, and subcomments

This is handled automatically by Django's `on_delete=CASCADE` setting.

### Validation Rules

#### Title Validation:
- **Required:** Yes
- **Min length:** 3 characters
- **Max length:** 200 characters
- **Type:** String

#### Content Validation:
- **Required:** Yes
- **Min length:** 10 characters
- **Max length:** 5000 characters
- **Type:** Text

### Updated At Field
The `updated_at` field is automatically updated when a thread is edited. This can be used to show "edited" indicators in the UI.

## UI/UX Recommendations

### Edit Feature
1. **Show edit button only to thread author**
   - Compare current user ID/username with `thread.author`
   
2. **Edit UI**
   - Pre-populate form with current title and content
   - Show character count (title: 200, content: 5000)
   - Validate before submission
   - Show loading state during update
   - Show success/error messages

3. **Edit indicator**
   - Show "edited" badge if `updated_at > created_at`
   - Display last edit time

### Delete Feature
1. **Show delete button only to thread author**
   - Compare current user ID/username with `thread.author`

2. **Confirmation dialog**
   - Warn user that deletion is permanent
   - Mention that all comments will also be deleted
   - Require explicit confirmation

3. **Post-deletion**
   - Navigate back to forum list
   - Show success message
   - Refresh forum thread list

## Testing Checklist

### Edit Functionality
- [ ] Thread author can edit their thread
- [ ] Non-authors cannot edit threads (403 error)
- [ ] Validation errors are handled properly
- [ ] Updated thread displays new content
- [ ] `updated_at` timestamp is updated
- [ ] Thread list is refreshed after edit

### Delete Functionality
- [ ] Thread author can delete their thread
- [ ] Non-authors cannot delete threads (403 error)
- [ ] Confirmation dialog is shown
- [ ] Thread is removed from list after deletion
- [ ] Navigation works correctly after deletion
- [ ] Comments are deleted with thread (cascade)

### Edge Cases
- [ ] Editing with empty title/content shows error
- [ ] Editing with too long title/content shows error
- [ ] Deleting non-existent thread shows 404
- [ ] Network errors are handled gracefully
- [ ] Concurrent edits are handled properly

## Example Implementation Flow

### Edit Flow
```
1. User taps "Edit" button on their thread
2. App opens edit form with pre-filled data
3. User modifies title and/or content
4. App validates input locally
5. App sends PUT request to /api/threads/{id}/
6. Backend validates and updates thread
7. App receives updated thread data
8. App updates local cache/state
9. App shows success message
10. App displays updated thread
```

### Delete Flow
```
1. User taps "Delete" button on their thread
2. App shows confirmation dialog
3. User confirms deletion
4. App sends DELETE request to /api/threads/{id}/
5. Backend deletes thread and cascades to comments
6. App receives success response
7. App removes thread from local cache/state
8. App navigates back to forum list
9. App shows success message
```

## Questions or Issues?

If you encounter any issues or have questions about the implementation:
1. Check the API documentation: `backend/genfit_django/api_documentations/forum_forumthreads.md`
2. Review the backend code: `backend/genfit_django/api/separate_views/forum_forumthread.py`
3. Contact the backend team

## Web Implementation Reference

The web frontend implementation can be found at:
- Hooks: `Web_Frontend/genfit_frontend/src/lib/hooks/useData.ts`
- Edit Modal: `Web_Frontend/genfit_frontend/src/pages/forum/components/ThreadEditModal.tsx`
- Actions Component: `Web_Frontend/genfit_frontend/src/pages/forum/components/ThreadActions.tsx`
- Thread Page: `Web_Frontend/genfit_frontend/src/pages/forum/thread/[id]/page.tsx`

---

**Implementation Date:** November 11, 2025  
**Backend Status:** ✅ Complete  
**Web Frontend Status:** ✅ Complete  
**Mobile Status:** ⏳ Pending Implementation
