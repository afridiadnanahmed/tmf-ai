# Messaging System Testing Guide

## Overview
The messaging system has been updated to properly handle bidirectional messaging between users with notifications and unread message tracking.

## Key Features Implemented

### 1. Bidirectional Messaging
- Messages are now properly filtered for both senders and recipients
- Each message tracks the `recipientEmail` to know who should receive it
- Users can see messages they've sent AND messages sent to them

### 2. Notification System
- Real-time notifications using toast alerts (via sonner)
- Automatic polling every 15 seconds for new messages
- Visual unread message count badges in the conversation list
- Messages are automatically marked as read when viewed

### 3. Database Updates
- Added `recipientEmail` field to messages table
- Added proper indexing for performance
- Messages track status: 'sent' (unread) or 'read'

## Testing Steps

### Step 1: Set Up Two Test Users
1. Create two user accounts with different emails:
   - User A: e.g., `user1@example.com`
   - User B: e.g., `adnan.fokus@gmail.com`

### Step 2: Test Sending Messages

#### As User A:
1. Log in as User A
2. Go to Messages & Comments section
3. Click the "+" button to add a new contact
4. Add User B's email (`adnan.fokus@gmail.com`)
5. Select the contact and send a message

#### As User B:
1. Log in as User B in a different browser/incognito window
2. Go to Messages & Comments section
3. You should see:
   - A notification toast appear within 15 seconds
   - The conversation with User A showing an unread count badge
   - The message from User A when you click on the conversation

### Step 3: Test Reply Messages
1. As User B, reply to User A's message
2. Switch to User A's browser
3. User A should receive a notification and see the reply

### Step 4: Test Read Status
1. When a user clicks on a conversation with unread messages:
   - The unread count should disappear
   - Messages are marked as read in the database
   - The sender won't see "unread" status anymore

## API Endpoints

### Core Messaging Endpoints
- `GET /api/messages` - Get all conversations with unread counts
- `GET /api/messages?conversationId={id}` - Get messages for a specific conversation
- `POST /api/messages` - Send a new message
- `GET /api/messages/unread` - Get all unread messages
- `POST /api/messages/mark-read` - Mark messages as read

## Troubleshooting

### Messages Not Appearing
1. Check that the recipient's email matches their account email exactly
2. Ensure the contact was created with the correct email
3. Check browser console for any API errors

### Notifications Not Working
1. Ensure you're logged in with the correct user
2. Check that notifications are enabled in browser settings
3. Look for toast notifications in the bottom-right corner
4. Check the console for any errors

### Database Issues
If you encounter database errors:
```bash
# Regenerate migrations
npx drizzle-kit generate

# Push schema changes
npx drizzle-kit push

# Or manually run the migration
psql $DATABASE_URL < migrations/add-recipient-email-to-messages.sql
```

## Technical Details

### Message Flow
1. User A sends message to Contact (User B)
2. Message is stored with:
   - `userId`: User A's ID (sender)
   - `contactId`: Contact record ID
   - `recipientEmail`: User B's email
   - `status`: 'sent' (unread)
3. User B's client polls for unread messages
4. Notification shown to User B
5. When User B views the message, status changes to 'read'

### Frontend Components
- `/components/dashboard/messages-screen.tsx` - Main messaging UI
- `/hooks/use-message-notifications.ts` - Notification polling hook

### Backend Updates
- `/lib/db/schema.ts` - Database schema with recipientEmail field
- `/app/api/messages/route.ts` - Core messaging API
- `/app/api/messages/unread/route.ts` - Unread messages endpoint
- `/app/api/messages/mark-read/route.ts` - Mark as read endpoint