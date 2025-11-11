/**
 * Utility Functions Tests
 * Simple example tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import { cn } from '../index';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('handles conditional classes', () => {
      const result = cn('base', false && 'hidden', true && 'visible');
      expect(result).toContain('base');
      expect(result).toContain('visible');
      expect(result).not.toContain('hidden');
    });

    it('handles undefined and null values', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('merges Tailwind classes correctly', () => {
      // Should handle conflicting Tailwind classes
      const result = cn('px-2', 'px-4');
      expect(result).toBeTruthy();
    });
  });
});

