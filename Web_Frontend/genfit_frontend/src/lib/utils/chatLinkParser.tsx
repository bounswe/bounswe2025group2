import React from 'react';

/**
 * Parses message text and converts challenge links and exercise mentions to clickable React elements
 * Challenge link format: challenge://{id}
 * Exercise mention format: @ExerciseName or @Exercise Name (with spaces)
 * Example: "Check out challenge://42 for a great workout! Try @Push Up"
 */

interface LinkSegment {
  type: 'text' | 'challenge' | 'exercise';
  content: string;
  challengeId?: number;
  exerciseName?: string;
}

/**
 * Regular expression to match challenge links
 * Format: challenge://{numeric_id}
 */
const CHALLENGE_LINK_REGEX = /challenge:\/\/(\d+)/g;

/**
 * Regular expression to match exercise mentions
 * Format: @ExerciseName (can include spaces, letters, hyphens, apostrophes, and parentheses)
 * Matches: @Push Up, @Bench Press, @Pull-Up, @Farmer's Carry, @Single-Leg Deadlift, @A-Skip
 * Requires Title Case format (each word starts with capital letter) to avoid false matches
 * Example: "@Push Up" works, "@push up" doesn't (use correct capitalization)
 * Note: For multi-word exercises, use Title Case: @Push Up, @Bench Press
 */
const EXERCISE_MENTION_REGEX = /@([A-Z]+[a-z]*(?:[\s\-'][A-Z]+[a-z]*)*(?:\s*\([^)]+\))?)/g;

/**
 * Parses a message string and returns an array of text, challenge links, and exercise mentions
 */
export const parseMessageForChallengeLinks = (message: string): LinkSegment[] => {
  const segments: LinkSegment[] = [];
  
  // Find all challenge links and exercise mentions with their positions
  const allMatches: Array<{
    type: 'challenge' | 'exercise';
    start: number;
    end: number;
    challengeId?: number;
    exerciseName?: string;
    fullMatch: string;
  }> = [];

  // Find challenge links
  const challengeMatches = message.matchAll(CHALLENGE_LINK_REGEX);
  for (const match of challengeMatches) {
    allMatches.push({
      type: 'challenge',
      start: match.index!,
      end: match.index! + match[0].length,
      challengeId: parseInt(match[1], 10),
      fullMatch: match[0]
    });
  }

  // Find exercise mentions
  const exerciseMatches = message.matchAll(EXERCISE_MENTION_REGEX);
  for (const match of exerciseMatches) {
    const exerciseName = match[1].trim();
    allMatches.push({
      type: 'exercise',
      start: match.index!,
      end: match.index! + match[0].length,
      exerciseName,
      fullMatch: match[0]
    });
  }

  // Sort matches by position
  allMatches.sort((a, b) => a.start - b.start);

  let lastIndex = 0;

  // Process all matches in order
  for (const match of allMatches) {
    // Add text before the match (if any)
    if (match.start > lastIndex) {
      segments.push({
        type: 'text',
        content: message.substring(lastIndex, match.start)
      });
    }

    // Add the match
    if (match.type === 'challenge') {
      segments.push({
        type: 'challenge',
        content: match.fullMatch,
        challengeId: match.challengeId
      });
    } else {
      segments.push({
        type: 'exercise',
        content: match.fullMatch,
        exerciseName: match.exerciseName
      });
    }

    lastIndex = match.end;
  }

  // Add remaining text after the last match (if any)
  if (lastIndex < message.length) {
    segments.push({
      type: 'text',
      content: message.substring(lastIndex)
    });
  }

  // If no matches were found, return the entire message as text
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

    if (segment.type === 'exercise' && segment.exerciseName) {
      return (
        <a
          key={index}
          href={`/knowledge-hub?exercise=${encodeURIComponent(segment.exerciseName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="exercise-link"
          title={`View ${segment.exerciseName} in glossary`}
        >
          @{segment.exerciseName}
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
 * Checks if a message contains any exercise mentions
 */
export const hasExerciseMentions = (message: string): boolean => {
  return EXERCISE_MENTION_REGEX.test(message);
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

/**
 * Extracts all exercise names from a message
 */
export const extractExerciseNames = (message: string): string[] => {
  const names: string[] = [];
  const matches = message.matchAll(EXERCISE_MENTION_REGEX);

  for (const match of matches) {
    names.push(match[1].trim());
  }

  return names;
};
