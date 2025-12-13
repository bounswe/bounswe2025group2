import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Parses message text and converts special links (challenges, hashtags) to clickable elements
 * Challenge link format: challenge://{id}
 * Hashtag format: #{term}
 */

interface LinkSegment {
  type: 'text' | 'challenge' | 'hashtag';
  content: string;
  challengeId?: number;
  hashtag?: string;
}

/**
 * Regular expressions
 */
const CHALLENGE_LINK_REGEX = /challenge:\/\/(\d+)/g;

// Combined regex for tokenization
const TOKEN_REGEX = /(challenge:\/\/\d+)|(#[a-zA-Z0-9_]+)/g;

/**
 * Parses a message string and returns an array of text and link segments
 */
export const parseMessageForChallengeLinks = (message: string): LinkSegment[] => {
  const segments: LinkSegment[] = [];
  let lastIndex = 0;

  // Find all tokens in the message
  const matches = message.matchAll(TOKEN_REGEX);

  for (const match of matches) {
    const matchStart = match.index!;
    const matchEnd = matchStart + match[0].length;
    const fullMatch = match[0];

    // Add text before the link (if any)
    if (matchStart > lastIndex) {
      segments.push({
        type: 'text',
        content: message.substring(lastIndex, matchStart)
      });
    }

    if (fullMatch.startsWith('challenge://')) {
      // It's a challenge link
      const matchId = fullMatch.match(/challenge:\/\/(\d+)/);
      const challengeId = matchId ? parseInt(matchId[1], 10) : 0;
      segments.push({
        type: 'challenge',
        content: fullMatch,
        challengeId
      });
    } else if (fullMatch.startsWith('#')) {
      // It's a hashtag
      const hashtag = fullMatch.substring(1); // remove #
      segments.push({
        type: 'hashtag',
        content: fullMatch,
        hashtag
      });
    }

    lastIndex = matchEnd;
  }

  // Add remaining text after the last link (if any)
  if (lastIndex < message.length) {
    segments.push({
      type: 'text',
      content: message.substring(lastIndex)
    });
  }

  // If no tokens were found, return the entire message as text
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
    } else if (segment.type === 'hashtag' && segment.hashtag) {
      return (
        <Link
          key={index}
          to={`/glossary?term=${segment.hashtag}`}
          className="hashtag-link text-blue-500 hover:underline"
          title={`Look up "${segment.hashtag}" in Glossary`}
        >
          {segment.content}
        </Link>
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
    if (match[1]) {
      ids.push(parseInt(match[1], 10));
    }
  }

  return ids;
};

