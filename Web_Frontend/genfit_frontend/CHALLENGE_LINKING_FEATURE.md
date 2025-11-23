# Challenge Linking Feature

## Overview
This feature allows users to share challenge links in chat messages. When a challenge link is clicked, it opens the challenges page in a new tab and automatically scrolls to the specified challenge.

## How to Use

### Sending Challenge Links in Chat

**Easy Method (Recommended):**
1. Click the **Trophy button** (🏆) next to the message input field
2. Browse or search for the challenge you want to share
3. Click **"Share This Challenge"** button on any challenge
4. The challenge link will be automatically inserted into your message
5. Add any additional text and send!

**Manual Method:**
You can also manually type challenge links using this format:
```
challenge://{challenge_id}
```

**Examples:**
- `Check out challenge://42 for a great workout!`
- `I just completed challenge://15, you should try it too!`
- `Let's do challenge://7 together!`

### What Happens When a Link is Clicked

1. The link opens the challenges page in a **new tab**
2. The page automatically scrolls to the specified challenge
3. The challenge card is **highlighted** with a pulsing animation for 2 seconds
4. All challenge functionalities are available (join, view details, update progress, etc.)

## Technical Implementation

### Components Modified

1. **`chatLinkParser.tsx`** (New Utility File)
   - Parses messages for challenge links
   - Converts challenge links to clickable React elements
   - Provides helper functions for link detection and extraction

2. **`ChallengePickerDialog.tsx`** (New Component)
   - Modal dialog for browsing and selecting challenges
   - Search functionality to filter challenges
   - Displays challenge details (status, difficulty, dates, participants)
   - Click to select and insert challenge into message

3. **`ChatPage.tsx`**
   - Renders messages with clickable challenge links
   - Trophy button to open challenge picker
   - Supports both user-to-user and AI chat messages
   - Links styled differently based on message type (sent/received/AI)
   - Automatic insertion of challenge links when selected

4. **`ChallengesPage.tsx`**
   - Reads `challengeId` URL parameter
   - Scrolls to the specified challenge on page load
   - Applies highlight animation to the target challenge

5. **CSS Styling**
   - `chat_page.css`: Challenge link styles, picker button, and dialog styles
   - `challenges_page.css`: Highlight animation for target challenges

### Link Format

The challenge link format is: `challenge://{id}`

Where `{id}` is the numeric ID of the challenge.

### URL Parameter

When a challenge link is clicked, the user is redirected to:

```
/challenges?challengeId={id}
```

## Styling Details

### Challenge Links in Messages

- **Regular messages**: Blue underlined links
- **Sent messages**: Yellow/gold links (to contrast with dark background)
- **AI messages**: Green links (matching AI theme)
- Hover effects: Color change and slight upward movement

### Challenge Highlight Animation

When a challenge is accessed via link:
- Pulsing shadow effect in maroon/red color
- Slight scale increase (2%)
- 2-second duration
- Smooth transitions

## UI Features

### Challenge Picker Dialog
- **Search Bar**: Quickly filter challenges by title, description, or type
- **Challenge Cards**: Each showing:
  - Title and status badge (Active/Upcoming/Inactive)
  - Challenge type and description
  - Date range and participant count
  - Difficulty level (Beginner/Intermediate/Advanced)
  - "Share This Challenge" button
- **Responsive Design**: Works on desktop and mobile devices
- **Visual Feedback**: Hover effects and smooth animations

### Trophy Button
- **Location**: Between message input and send button
- **Color Coding**:
  - Gold/orange for regular chats
  - Purple gradient for AI chats
- **States**: Disabled when chat is disconnected or loading
- **Tooltip**: "Share a challenge" on hover

### Challenge Links in Messages
- **Automatic Detection**: Any `challenge://{id}` format is converted to a clickable link
- **Visual Styling**:
  - Blue links in received messages
  - Gold/yellow links in sent messages
  - Green links in AI messages
- **Hover Effects**: Color change and slight upward movement
- **Opens in New Tab**: Doesn't interrupt the current chat session

## Future Enhancements

Potential improvements for this feature:

1. **Rich Preview**: Show challenge preview card when hovering over link
2. **Recent/Popular Challenges**: Show frequently shared or popular challenges first
3. **Inline Challenge Info**: Display basic challenge info (title, difficulty) next to link
4. **Multiple Challenge Support**: Select and share multiple challenges at once
5. **Deep Linking**: Support linking to specific challenge sections (e.g., leaderboard)
6. **Notifications**: Notify users when someone shares a challenge with them
7. **Quick Actions**: Join challenge directly from chat message link

## Code Examples

### Parsing Challenge Links

```typescript
import { parseMessageForChallengeLinks, hasChallengeLinks } from '@/lib/utils/chatLinkParser';

const message = "Try challenge://42!";

// Check if message has links
if (hasChallengeLinks(message)) {
  // Parse the message
  const segments = parseMessageForChallengeLinks(message);
  // Returns: [
  //   { type: 'text', content: 'Try ' },
  //   { type: 'challenge', content: 'challenge://42', challengeId: 42 },
  //   { type: 'text', content: '!' }
  // ]
}
```

### Rendering Messages with Links

```typescript
import { renderMessageWithChallengeLinks } from '@/lib/utils/chatLinkParser';

const message = "Check out challenge://42!";
const rendered = renderMessageWithChallengeLinks(message);
// Returns: React nodes with clickable challenge links
```

## Testing

To test this feature:

1. **Create a challenge** (as a coach) or ensure there are existing challenges
2. **Navigate to the chat page**
3. **Click the Trophy button** (🏆) next to the message input
4. **Verify** the challenge picker dialog opens
5. **Search or browse** for a challenge
6. **Click "Share This Challenge"** on any challenge
7. **Verify** the challenge link appears in the message input
8. **Send the message**
9. **Click the link** in the sent message
10. **Verify** the challenges page opens in a new tab
11. **Verify** the page scrolls to the correct challenge
12. **Verify** the challenge is highlighted with the animation

## Browser Compatibility

This feature uses standard web APIs and should work on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

The feature requires JavaScript to be enabled.
