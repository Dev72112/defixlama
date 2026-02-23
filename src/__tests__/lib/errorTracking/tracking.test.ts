import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initErrorTracking,
  captureException,
  captureMessage,
  getTrackedErrors,
  clearErrorLog,
  exportErrorLog,
} from '@/lib/errorTracking/tracking';

describe('Error Tracking', () => {
  beforeEach(() => {
    clearErrorLog();
    // Mock sessionStorage
    const store: Record<string, string> = {};
    global.sessionStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((key) => delete store[key]);
      },
      length: 0,
      key: () => null,
    } as any;
  });

  describe('captureException', () => {
    it('should log Error objects', () => {
      const error = new Error('Test error');
      captureException(error);

      const errors = getTrackedErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toBe('Test error');
      expect(errors[0].level).toBe('error');
    });

    it('should log string errors', () => {
      captureException('String error');

      const errors = getTrackedErrors();
      expect(errors[0].message).toBe('String error');
    });

    it('should include context', () => {
      captureException(new Error('Test'), { userId: '123', action: 'test' });

      const errors = getTrackedErrors();
      expect(errors[0].context).toEqual({ userId: '123', action: 'test' });
    });

    it('should include stack trace', () => {
      const error = new Error('Test error');
      captureException(error);

      const errors = getTrackedErrors();
      expect(errors[0].stack).toBeDefined();
    });
  });

  describe('captureMessage', () => {
    it('should log info messages', () => {
      captureMessage('Test message', 'info');

      const errors = getTrackedErrors();
      expect(errors[0].message).toBe('Test message');
      expect(errors[0].level).toBe('info');
    });

    it('should log warning messages', () => {
      captureMessage('Warning message', 'warning');

      const errors = getTrackedErrors();
      expect(errors[0].level).toBe('warning');
    });

    it('should default to info level', () => {
      captureMessage('Default message');

      const errors = getTrackedErrors();
      expect(errors[0].level).toBe('info');
    });
  });

  describe('Error log management', () => {
    it('should store timestamp', () => {
      captureMessage('Test');

      const errors = getTrackedErrors();
      expect(errors[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should store URL', () => {
      captureMessage('Test');

      const errors = getTrackedErrors();
      expect(errors[0].url).toBeDefined();
    });

    it('should clear all errors', () => {
      captureMessage('Error 1');
      captureMessage('Error 2');

      expect(getTrackedErrors().length).toBe(2);

      clearErrorLog();

      expect(getTrackedErrors().length).toBe(0);
    });

    it('should limit stored errors to 50', () => {
      for (let i = 0; i < 60; i++) {
        captureMessage(`Error ${i}`);
      }

      const errors = getTrackedErrors();
      expect(errors.length).toBeLessThanOrEqual(50);
    });
  });

  describe('exportErrorLog', () => {
    it('should export as valid JSON', () => {
      captureMessage('Test');
      const exported = exportErrorLog();

      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should include all error data', () => {
      captureException(new Error('Test'), { userId: '123' });
      const exported = JSON.parse(exportErrorLog());

      expect(exported.length).toBeGreaterThan(0);
      expect(exported[0].message).toBe('Test');
      expect(exported[0].context.userId).toBe('123');
    });
  });

  describe('Error tracking in order', () => {
    it('should store errors with most recent first', () => {
      captureMessage('First');
      captureMessage('Second');
      captureMessage('Third');

      const errors = getTrackedErrors();
      expect(errors[0].message).toBe('Third');
      expect(errors[1].message).toBe('Second');
      expect(errors[2].message).toBe('First');
    });
  });
});
