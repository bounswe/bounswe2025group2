# Chat Application Documentation

This documentation covers the API endpoints and WebSocket connections for the real-time chat application.

## Table of Contents

1. [REST API Endpoints](#rest-api-endpoints)
   - [Get Users](#get-users)
   - [Get Chats](#get-chats)
   - [Create Chat](#create-chat)
2. [WebSocket Connections](#websocket-connections)
   - [Direct Chat Connection](#direct-chat-connection)
   - [Message Structure](#message-structure)
3. [Data Models](#data-models)
   - [User](#user)
   - [DirectChat](#directchat)
   - [DirectMessage](#directmessage)

## REST API Endpoints

All REST API endpoints require authentication. The application uses token-based authentication.

### Get Users

Retrieves all users except the requesting user.

- **URL**: `/api/users/`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  - **Status Code**: 200 OK
  - **Content**: List of users with their ID and username
  
```json
[
  {
    "id": 1,
    "username": "user1"
  },
  {
    "id": 2,
    "username": "user2"
  }
]
```

### Get Chats

Retrieves all direct chats for the requesting user.

- **URL**: `/api/chats/`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  - **Status Code**: 200 OK
  - **Content**: List of chats with participants, other user, creation time, last message, and unread count

```json
[
  {
    "id": 1,
    "participants": [
      {
        "id": 1,
        "username": "user1"
      },
      {
        "id": 2,
        "username": "user2"
      }
    ],
    "other_user": {
      "id": 2,
      "username": "user2"
    },
    "created": "2025-05-01T12:00:00Z",
    "last_message": {
      "body": "Hello there!",
      "created": "2025-05-01T12:05:00Z",
      "sender": "user2"
    },
    "unread_count": 1
  }
]
```

### Create Chat

Creates a new direct chat between the requesting user and another user.

- **URL**: `/api/chats/create/`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  
```json
{
  "user_id": 2
}
```

- **Response**:
  - **Status Code**: 201 Created
  - **Content**: Chat details with participants, other user, and creation time
  
```json
{
  "id": 1,
  "participants": [
    {
      "id": 1,
      "username": "user1"
    },
    {
      "id": 2,
      "username": "user2"
    }
  ],
  "other_user": {
    "id": 2,
    "username": "user2"
  },
  "created": "2025-05-02T10:30:00Z",
  "last_message": null,
  "unread_count": 0
}
```

- **Error Responses**:
  - 400 Bad Request: If the user_id is invalid, doesn't exist, or is the same as the requesting user
  - 400 Bad Request: If the chat fails to create with a valid other user

## WebSocket Connections

### Direct Chat Connection

The application uses WebSockets for real-time chat functionality.

- **WebSocket URL**: `ws://domain/ws/chat/<chat_id>/`
- **Authentication**: Required (via session)
- **Connection Lifecycle**:
  1. Connect: When a user connects, they receive all existing messages for the chat.
  2. Receive: Users can send messages to the chat.
  3. Disconnect: Users can disconnect from the chat.

#### Connection Process:

1. The client establishes a WebSocket connection to `ws://domain/ws/chat/<chat_id>/`
2. The server verifies:
   - User is authenticated
   - Chat exists
   - User is a participant in the chat
3. If verification passes, the server:
   - Adds the user to the chat group
   - Sends all existing messages to the user
   - Marks messages from other users as read

#### Sending Messages:

To send a message, the client sends a JSON object:

```json
{
  "body": "Hello, how are you?"
}
```

#### Receiving Messages:

The server broadcasts messages to all connected clients in a chat:

```json
{
  "message": {
    "id": 123,
    "sender": "user1",
    "body": "Hello, how are you?",
    "created": "2025-05-02 10:45:30",
    "is_read": false
  }
}
```

#### Error Handling:

If an error occurs during message processing, the server sends:

```json
{
  "error": "An error occurred while processing your message"
}
```

## Data Models

### User

Standard Django user model with the following serialized fields:

- `id`: Integer
- `username`: String

### DirectChat

Represents a direct chat between two users:

- `id`: Integer
- `participants`: Many-to-many relationship with User
- `created`: DateTime (automatically set on creation)

Serialized with additional fields:
- `other_user`: The other participant in the chat (not the requesting user)
- `last_message`: The most recent message in the chat
- `unread_count`: Number of unread messages from the other user

### DirectMessage

Represents a message in a direct chat:

- `id`: Integer
- `chat`: ForeignKey to DirectChat
- `sender`: ForeignKey to User
- `body`: Text content of the message
- `created`: DateTime (automatically set on creation)
- `is_read`: Boolean (default: False)

Messages are automatically marked as read when a user connects to the chat.