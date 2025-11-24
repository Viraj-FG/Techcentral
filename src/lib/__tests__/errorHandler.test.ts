import { describe, it, expect } from 'vitest';
import { categorizeError, getUserFriendlyMessage } from '../errorHandler';

describe('errorHandler', () => {
  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const error = new Error('Network request failed');
      expect(categorizeError(error)).toBe('network');
    });

    it('should categorize auth errors', () => {
      const error = new Error('Unauthorized access');
      expect(categorizeError(error)).toBe('auth');
    });

    it('should categorize database errors', () => {
      const error = new Error('Supabase query failed');
      expect(categorizeError(error)).toBe('database');
    });

    it('should categorize unknown errors', () => {
      const error = new Error('Something random');
      expect(categorizeError(error)).toBe('unknown');
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return correct message for network error', () => {
      expect(getUserFriendlyMessage('network', 'msg')).toContain('Unable to connect');
    });

    it('should return correct message for auth error', () => {
      expect(getUserFriendlyMessage('auth', 'msg')).toContain('Authentication failed');
    });
  });
});
