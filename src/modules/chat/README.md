# Chat Module

Booking-scoped chat between `customer` and `influencer`, with S3-backed attachments and realtime socket events.

## What This Module Supports

- One chat room per booking
- Customer to influencer chat
- Text messages
- Attachment messages
- Read status tracking
- Unread counts per participant
- Realtime room updates through sockets

## Supported Attachments

- Images
- GIFs
- Videos
- PDFs
- Documents

Attachments are uploaded through the existing S3 service and stored as chat message attachments.

## Swagger Base URL

Open Swagger at:

```text
http://localhost:8000/docs
```

## Prerequisites Before Testing Chat

You need these records first:

1. A verified customer account
2. A verified influencer account
3. An influencer profile
4. A campaign created by the customer
5. A booking linking that campaign to the influencer

## Step-by-Step Swagger Test Flow

### 1. Login as Influencer

Use `POST /api/auth/login`

```json
{
  "email": "influencer@example.com",
  "password": "Password123"
}
```

Copy the access token.

### 2. Authorize Swagger as Influencer

Click `Authorize` and paste:

```text
Bearer INFLUENCER_TOKEN
```

### 3. Get Influencer Profile ID

Use `GET /api/influencers`

Find your influencer profile and copy its `id`.

This is the `influencerId`.

### 4. Login as Customer

Use `POST /api/auth/login`

```json
{
  "email": "customer@example.com",
  "password": "Password123"
}
```

Copy the access token.

### 5. Authorize Swagger as Customer

Click `Authorize` and paste:

```text
Bearer CUSTOMER_TOKEN
```

### 6. Create Campaign

Use `POST /api/campaigns`

```json
{
  "title": "Summer Launch Campaign",
  "description": "Need 2 reels and 3 story promotions.",
  "budget": 5000,
  "startDate": "2026-03-25",
  "endDate": "2026-04-05",
  "status": "draft"
}
```

Copy the returned `id` as `campaignId`.

### 7. Create Booking

Use `POST /api/bookings`

```json
{
  "campaignId": "PASTE_CAMPAIGN_ID",
  "influencerId": "PASTE_INFLUENCER_ID",
  "agreedPrice": 1500,
  "notes": "Need 2 reels and 3 stories"
}
```

Copy the returned `id` as `bookingId`.

### 8. Create Chat Room

Use `POST /api/chat/rooms`

```json
{
  "bookingId": "PASTE_BOOKING_ID"
}
```

Copy the returned `id` as `roomId`.

### 9. Send First Text Message

Use `POST /api/chat/rooms/{roomId}/messages`

```json
{
  "text": "Hello, let's discuss the campaign deliverables."
}
```

### 10. View Message History

Use `GET /api/chat/rooms/{roomId}/messages`

Optional query params:

- `page=1`
- `limit=20`

### 11. Send Attachment Message

Use `POST /api/chat/rooms/{roomId}/messages/attachments`

In Swagger:

- select one or more files
- optionally add `text`

Example text:

```text
Please review these assets.
```

### 12. Mark Messages as Read

Use `PATCH /api/chat/rooms/{roomId}/read`

This marks unread messages in that room as read for the current user.

### 13. Switch to Influencer

Authorize Swagger again with the influencer token.

### 14. List Influencer Chat Rooms

Use `GET /api/chat/rooms`

You should see the same room.

### 15. Open the Room and Read Messages

Use:

- `GET /api/chat/rooms/{roomId}`
- `GET /api/chat/rooms/{roomId}/messages`

### 16. Reply as Influencer

Use `POST /api/chat/rooms/{roomId}/messages`

```json
{
  "text": "Sure, I am interested. Please share the final brief."
}
```

### 17. Mark as Read as Influencer

Use `PATCH /api/chat/rooms/{roomId}/read`

### 18. Switch Back to Customer

Authorize Swagger again with the customer token.

Use:

- `GET /api/chat/rooms`
- `GET /api/chat/rooms/{roomId}/messages`

You should now see both sides of the conversation.

## Chat API Summary

- `POST /api/chat/rooms`
- `GET /api/chat/rooms`
- `GET /api/chat/rooms/:roomId`
- `GET /api/chat/rooms/:roomId/messages`
- `POST /api/chat/rooms/:roomId/messages`
- `POST /api/chat/rooms/:roomId/messages/attachments`
- `PATCH /api/chat/rooms/:roomId/read`

## Access Rules

- Customer can access only their booking chat rooms
- Influencer can access only their assigned booking chat rooms
- Admin can access all chat rooms
- Chat room creation requires a valid booking

## Socket Testing

Swagger tests only the HTTP chat APIs.

For realtime events, use a frontend client, Postman websocket client, or a socket client.

Socket namespace:

```text
/ws
```

Pass JWT in one of these ways:

- `auth.token`
- `Authorization` header
- `query.token`

### Join a Chat Room

Client emits:

```json
{
  "event": "chat.room.join",
  "data": {
    "roomId": "PASTE_ROOM_ID"
  }
}
```

### Leave a Chat Room

Client emits:

```json
{
  "event": "chat.room.leave",
  "data": {
    "roomId": "PASTE_ROOM_ID"
  }
}
```

### Realtime Events Emitted by Server

- `chat.room.updated`
- `chat.message.sent`
- `chat.message.read`

## Notes

- Chat is currently booking-scoped by design
- One room is created per booking
- Room events are sent only to authorized joined participants
- Attachments are not sent through socket directly; they are uploaded to S3 first

## Additional Chat Features

### Edit a Message

Use `PATCH /api/chat/messages/{messageId}`

```json
{
  "text": "Updated message after confirming the final brief."
}
```

Rules:

- only the sender or admin can edit
- deleted messages cannot be edited
- if the edited message is the latest room message, the room preview is updated too

### Delete a Message

Use `DELETE /api/chat/messages/{messageId}`

Rules:

- only the sender or admin can delete
- delete is soft for the message record
- linked attachment metadata is removed from chat history
- linked attachment files are removed from S3
- if the deleted message is the latest room message, the room preview becomes `Message deleted`

### Typing Indicators

Client emits:

```json
{
  "event": "chat.typing.start",
  "data": {
    "roomId": "PASTE_ROOM_ID"
  }
}
```

Client emits:

```json
{
  "event": "chat.typing.stop",
  "data": {
    "roomId": "PASTE_ROOM_ID"
  }
}
```

Server emits:

- `chat.typing.started`
- `chat.typing.stopped`
- `chat.message.updated`
- `chat.message.deleted`
