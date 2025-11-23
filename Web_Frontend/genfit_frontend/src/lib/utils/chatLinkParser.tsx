import React from 'react';

/**
 * Parses message text and converts challenge links to clickable React elements
 * Challenge link format: challenge://{id}
 * Example: "Check out challenge://42 for a great workout!"
 */

interface LinkSegment {
  type: 'text' | 'challenge';
  content: string;
  challengeId?: number;
}

/**
 * Regular expression to match challenge links
 * Format: challenge://{numeric_id}
 */
const CHALLENGE_LINK_REGEX = /challenge:\/\/(\d+)/g;

/**
 * Parses a message string and returns an array of text and link segments
 */
export const parseMessageForChallengeLinks = (message: string): LinkSegment[] => {
  const segments: LinkSegment[] = [];
  let lastIndex = 0;

  // Find all challenge links in the message
  const matches = message.matchAll(CHALLENGE_LINK_REGEX);

  for (const match of matches) {
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;
    const challengeId = parseInt(match[1], 10);

    // Add text before the link (if any)
    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        content: message.substring(lastIndex, matchStart)
      });
    }

    // Add the challenge link
    segments.push({
      type: 'challenge',
      content: match[0],
      challengeId
    });

    lastIndex = matchEnd;
  }

  // Add remaining text after the last link (if any)
  if (lastIndex < message.length) {
    segments.push({
      type: 'text',
      content: message.substring(lastIndex)
    });
  }

  // If no links were found, return the entire message as text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: message
    });
  }

  return segments;
};

/**
 * Renders parsed message segments as React elements
 */
export const renderMessageWithChallengeLinks = (message: string): React.ReactNode => {
  const segments = parseMessageForChallengeLinks(message);

  return segments.map((segment, index) => {
    if (segment.type === 'challenge' && segment.challengeId) {
      return (
        <a
          key={index}
          href={`/challenges?challengeId=${segment.challengeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="challenge-link"
          title={`Open Challenge #${segment.challengeId}`}
        >
          Challenge #{segment.challengeId}
        </a>
      );
    }

    return <span key={index}>{segment.content}</span>;
  });
};

/**
 * Checks if a message contains any challenge links
 */
export const hasChallengeLinks = (message: string): boolean => {
  return CHALLENGE_LINK_REGEX.test(message);
};

/**
 * Extracts all challenge IDs from a message
 */
export const extractChallengeIds = (message: string): number[] => {
  const ids: number[] = [];
  const matches = message.matchAll(CHALLENGE_LINK_REGEX);

  for (const match of matches) {
    ids.push(parseInt(match[1], 10));
  }

  return ids;
};
