/**
 * Sentry error tracking configuration
 *
 * To use this, first install Sentry:
 * npm install @sentry/react @sentry/tracing
 *
 * Then initialize in main.tsx:
 * import { initSentry } from '@/lib/errorTracking/sentry';
 * initSentry();
 *
 * Or if you're unable to install Sentry for any reason,
 * this file provides local error tracking as fallback.
 */

interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  url: string;
  userAgent: string;
}

/**
 * Local error tracking implementation
 * Stores errors in sessionStorage if Sentry not available
 */
class LocalErrorTracker {
  private readonly maxErrors = 50;
  private readonly storageKey = 'app_errors';

  log(error: ErrorLog): void {
    const errors = this.getErrors();

    // Add new error
    errors.unshift(error);

    // Keep only recent errors
    const limited = errors.slice(0, this.maxErrors);

    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(limited));
    } catch (e) {
      console.warn('Failed to store error log:', e);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[${error.level.toUpperCase()}] ${error.message}`, {
        stack: error.stack,
        context: error.context,
      });
    }
  }

  getErrors(): ErrorLog[] {
    try {
      const stored = sessionStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(this.storageKey);
    } catch (e) {
      console.warn('Failed to clear error log:', e);
    }
  }

  exportErrors(): string {
    return JSON.stringify(this.getErrors(), null, 2);
  }
}

// Global error tracker instance
const localErrorTracker = new LocalErrorTracker();

/**
 * Initialize error tracking
 * This function sets up both Sentry (if available) and local tracking
 */
export async function initErrorTracking(): Promise<void> {
  // Setup global error handler
  window.addEventListener('error', (event) => {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: event.message || 'Unknown error',
      stack: event.error?.stack,
      context: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    localErrorTracker.log(errorLog);

    // Try to send to Sentry if available
    if (window.__SENTRY__) {
      captureException(event.error || new Error(event.message));
    }
  });

  // Setup unhandled rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason) || 'Unhandled Promise rejection';

    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `Unhandled rejection: ${message}`,
      stack: reason?.stack,
      context: {
        promise: true,
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    localErrorTracker.log(errorLog);

    // Try to send to Sentry if available
    if (window.__SENTRY__) {
      captureException(reason);
    }
  });

  // Log page navigation
  window.addEventListener('popstate', () => {
    const infoLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Page navigation',
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
    localErrorTracker.log(infoLog);
  });

  console.log('✓ Error tracking initialized');
}

/**
 * Capture an exception and send to Sentry + local tracker
 */
export function captureException(error: Error | unknown, context?: Record<string, any>): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    stack,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  localErrorTracker.log(errorLog);

  // Try Sentry if available
  if (window.__SENTRY__) {
    try {
      if (typeof Sentry !== 'undefined') {
        Sentry.captureException(error, { contexts: { app: context } });
      }
    } catch (e) {
      console.warn('Failed to send to Sentry:', e);
    }
  }
}

/**
 * Capture a message (breadcrumb)
 */
export function captureMessage(message: string, level: 'info' | 'warning' = 'info'): void {
  const log: ErrorLog = {
    timestamp: new Date().toISOString(),
    level,
    message,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  localErrorTracker.log(log);

  // Try Sentry if available
  if (window.__SENTRY__) {
    try {
      if (typeof Sentry !== 'undefined') {
        Sentry.captureMessage(message, level);
      }
    } catch (e) {
      console.warn('Failed to send message to Sentry:', e);
    }
  }
}

/**
 * Get all tracked errors
 */
export function getTrackedErrors(): ErrorLog[] {
  return localErrorTracker.getErrors();
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  localErrorTracker.clear();
}

/**
 * Export errors as JSON for debugging
 */
export function exportErrorLog(): string {
  return localErrorTracker.exportErrors();
}

/**
 * Set user context for error tracking
 */
export function setErrorTrackingUser(userId: string | null, email?: string): void {
  if (window.__SENTRY__ && typeof Sentry !== 'undefined') {
    if (userId) {
      Sentry.setUser({ id: userId, email });
    } else {
      Sentry.setUser(null);
    }
  }
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
): void {
  if (window.__SENTRY__ && typeof Sentry !== 'undefined') {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  }

  // Also log locally
  const log: ErrorLog = {
    timestamp: new Date().toISOString(),
    level: level as 'error' | 'warning' | 'info' | undefined || 'info',
    message,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
  localErrorTracker.log(log);
}

// Declare Sentry globally for TypeScript
declare global {
  interface Window {
    __SENTRY__?: boolean;
  }
}
