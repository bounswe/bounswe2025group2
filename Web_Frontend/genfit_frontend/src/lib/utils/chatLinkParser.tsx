import React from 'react';
import { glossaryExercises } from '../../pages/knowledge-hub/glossaryData';


/**
 * Parses message text and converts special links to clickable elements.
 * Challenge link format: challenge://{id}
 * Hashtag format: #{term}
 * Exercise link formats: 
 *   - exercise://{id} (direct ID reference)
 *   - @ExerciseName (name-based reference, converted to ID)
 * Example: "Check out challenge://42 for a great workout! Try exercise://1 or @Push Up and #cardio"
 */

interface LinkSegment {
  type: 'text' | 'challenge' | 'exercise' | 'hashtag';
  content: string;
  challengeId?: number;
  exerciseId?: number;
  exerciseName?: string;
  hashtag?: string;
}

/**
 * Regular expressions
 */
const CHALLENGE_LINK_REGEX = /challenge:\/\/(\d+)/g;
const HASHTAG_REGEX = /#[a-zA-Z0-9_]+/g;

/**
 * Regular expression to match exercise links (by ID)
 * Format: exercise://{numeric_id}
 */
const EXERCISE_LINK_REGEX = /exercise:\/\/(\d+)/g;

/**
 * Regular expression to match exercise mentions (by name)
 * Format: @ExerciseName (can include spaces, letters, hyphens, apostrophes, and parentheses)
 * Matches: @Push Up, @Bench Press, @Pull-Up, @Farmer's Carry, @Single-Leg Deadlift, @A-Skip
 * Requires Title Case format (each word starts with capital letter) to avoid false matches
 */
const EXERCISE_MENTION_REGEX = /@([A-Z]+[a-z]*(?:[\s\-'][A-Z]+[a-z]*)*(?:\s*\([^)]+\))?)/g;

/**
 * Parses a message string and returns an array of text, challenge links, exercise mentions, and hashtags
 */
export const parseMessageForChallengeLinks = (message: string): LinkSegment[] => {
  const segments: LinkSegment[] = [];

  // Find all challenge links, exercise mentions, and hashtags with their positions
  const allMatches: Array<{
    type: 'challenge' | 'exercise' | 'hashtag';
    start: number;
    end: number;
    challengeId?: number;
    exerciseId?: number;
    exerciseName?: string;
    hashtag?: string;
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

  // Find exercise links (by ID)
  const exerciseMatches = message.matchAll(EXERCISE_LINK_REGEX);
  for (const match of exerciseMatches) {
    allMatches.push({
      type: 'exercise',
      start: match.index!,
      end: match.index! + match[0].length,
      exerciseId: parseInt(match[1], 10),
      fullMatch: match[0]
    });
  }

  // Find exercise mentions (by name)
  const exerciseMentionMatches = message.matchAll(EXERCISE_MENTION_REGEX);
  for (const match of exerciseMentionMatches) {
    const exerciseName = match[1].trim();
    allMatches.push({
      type: 'exercise',
      start: match.index!,
      end: match.index! + match[0].length,
      exerciseName,
      fullMatch: match[0]
    });
  }

  // Find hashtags
  const hashtagMatches = message.matchAll(HASHTAG_REGEX);
  for (const match of hashtagMatches) {
    const hashtag = match[0].substring(1); // remove #
    allMatches.push({
      type: 'hashtag',
      start: match.index!,
      end: match.index! + match[0].length,
      hashtag,
      fullMatch: match[0]
    });
  }

  // Sort matches by position to handle them in order
  allMatches.sort((a, b) => a.start - b.start);

  let lastIndex = 0;

  // Process all matches in order
  for (const match of allMatches) {
    // If there is an overlap with a previous match, skip this one
    // (This is a simple collision resolution: first match wins)
    if (match.start < lastIndex) {
      continue;
    }

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
    } else if (match.type === 'exercise') {
      segments.push({
        type: 'exercise',
        content: match.fullMatch,
        exerciseId: match.exerciseId,
        exerciseName: match.exerciseName
      });
    } else if (match.type === 'hashtag') {
      segments.push({
        type: 'hashtag',
        content: match.fullMatch,
        hashtag: match.hashtag
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
 * Helper function to find exercise ID by name
 */
const findExerciseIdByName = (name: string): number | undefined => {
  const exercise = glossaryExercises.find(
    ex => ex.name.toLowerCase() === name.toLowerCase()
  );
  return exercise?.id;
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
        <a
          key={index}
          href={`/knowledge-hub?term=${segment.hashtag}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hashtag-link text-blue-500 hover:underline"
          title={`Look up "${segment.hashtag}" in Glossary`}
        >
          {segment.content}
        </a>
      );
    } else if (segment.type === 'exercise') {
      // Handle both ID-based and name-based exercise links
      let exerciseId = segment.exerciseId;
      let displayText = '';
      let titleText = '';

      if (segment.exerciseId) {
        // Direct ID reference (exercise://1)
        displayText = `Exercise #${segment.exerciseId}`;
        titleText = `View Exercise #${segment.exerciseId} in glossary`;
      } else if (segment.exerciseName) {
        // Name-based reference (@Push Up)
        const foundId = findExerciseIdByName(segment.exerciseName);
        if (foundId) {
          exerciseId = foundId;
          displayText = `@${segment.exerciseName}`;
          titleText = `View ${segment.exerciseName} in glossary`;
        } else {
          // Fallback if name not found in local glossary, still link to query param
          displayText = `@${segment.exerciseName}`;
          titleText = `Search ${segment.exerciseName} in glossary`;
        }
      }

      // If we have an ID, allow lookup by ID. If not, allow lookup by name.
      if (exerciseId) {
        return (
          <a
            key={index}
            href={`/knowledge-hub?exerciseId=${exerciseId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="exercise-link"
            title={titleText}
          >
            {displayText}
          </a>
        );
      } else if (segment.exerciseName) {
        return (
          <a
            key={index}
            href={`/knowledge-hub?exercise=${encodeURIComponent(segment.exerciseName)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="exercise-link"
            title={titleText}
          >
            {displayText}
          </a>
        );
      } else {
        // If exercise not found and no name to search, render as plain text
        return <span key={index}>{segment.content}</span>;
      }
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
 * Checks if a message contains any exercise links (by ID)
 */
export const hasExerciseLinks = (message: string): boolean => {
  return EXERCISE_LINK_REGEX.test(message);
};

/**
 * Checks if a message contains any exercise mentions (by name)
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
    if (match[1]) {
      ids.push(parseInt(match[1], 10));
    }
  }

  return ids;
};

/**
 * Extracts all exercise IDs from a message (from exercise:// links only)
 */
export const extractExerciseIds = (message: string): number[] => {
  const ids: number[] = [];
  const matches = message.matchAll(EXERCISE_LINK_REGEX);

  for (const match of matches) {
    ids.push(parseInt(match[1], 10));
  }

  return ids;
};

/**
 * Extracts all exercise names from a message (from @ mentions)
 */
export const extractExerciseNames = (message: string): string[] => {
  const names: string[] = [];
  const matches = message.matchAll(EXERCISE_MENTION_REGEX);

  for (const match of matches) {
    names.push(match[1].trim());
  }

  return names;
};
