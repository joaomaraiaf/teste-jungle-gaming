import { describe, expect, it } from 'vitest';
import { cn, maskEmail } from './utils';

describe('utils (unit)', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('should handle conditional class names', () => {
      expect(cn('bg-red-500', false && 'text-white', 'p-4')).toBe('bg-red-500 p-4');
    });

    it('should resolve tailwind conflicts', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
    });
  });

  describe('maskEmail', () => {
    it('should mask email correctly', () => {
      expect(maskEmail('johndoe@example.com')).toBe('j*****e@example.com');
    });

    it('should handle short usernames', () => {
      expect(maskEmail('jo@example.com')).toBe('**@example.com');
    });

    it('should return empty string for empty input', () => {
      expect(maskEmail('')).toBe('');
    });

    it('should return original string for invalid email', () => {
      expect(maskEmail('invalid-email')).toBe('invalid-email');
    });
  });
});
