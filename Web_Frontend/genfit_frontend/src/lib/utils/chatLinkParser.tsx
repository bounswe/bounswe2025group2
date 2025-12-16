import React from 'react';
import { glossaryExercises } from '../../pages/knowledge-hub/GlossaryPage';

/**
 * Parses message text and converts challenge links and exercise links to clickable React elements
 * Challenge link format: challenge://{id}
 * Exercise link formats: 
 *   - exercise://{id} (direct ID reference)
 *   - @ExerciseName (name-based reference, converted to ID)
 * Example: "Check out challenge://42 for a great workout! Try exercise://1 or @Push Up"
 */

interface LinkSegment {
  type: 'text' | 'challenge' | 'exercise';
  content: string;
  challengeId?: number;
  exerciseId?: number;
  exerciseName?: string;
}

/**
 * Regular expression to match challenge links
 * Format: challenge://{numeric_id}
 */
const CHALLENGE_LINK_REGEX = /challenge:\/\/(\d+)/g;

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
 * Parses a message string and returns an array of text, challenge links, and exercise links
 */
export const parseMessageForChallengeLinks = (message: string): LinkSegment[] => {
  const segments: LinkSegment[] = [];
  
  // Find all challenge links, exercise links, and exercise mentions with their positions
  const allMatches: Array<{
    type: 'challenge' | 'exercise';
    start: number;
    end: number;
    challengeId?: number;
    exerciseId?: number;
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
        exerciseId: match.exerciseId,
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
    }

    if (segment.type === 'exercise') {
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
        exerciseId = findExerciseIdByName(segment.exerciseName);
        displayText = `@${segment.exerciseName}`;
        titleText = `View ${segment.exerciseName} in glossary`;
      }

      // Only render link if we have a valid exercise ID
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
      } else {
        // If exercise not found, render as plain text
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
    ids.push(parseInt(match[1], 10));
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
