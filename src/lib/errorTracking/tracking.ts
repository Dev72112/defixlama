export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  severity: "error" | "warning" | "info";
  context?: Record<string, unknown>;
}

export interface Breadcrumb {
  message: string;
  category: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

const MAX_ERRORS = 50;
const MAX_BREADCRUMBS = 30;
const STORAGE_KEY = "xlayer-error-log";

let errors: TrackedError[] = [];
let breadcrumbs: Breadcrumb[] = [];

function generateId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addBreadcrumb(message: string, category = "app", data?: Record<string, unknown>) {
  breadcrumbs.push({ message, category, timestamp: Date.now(), data });
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs = breadcrumbs.slice(-MAX_BREADCRUMBS);
  }
}

export function captureException(
  error: Error | unknown,
  context?: Record<string, unknown>
): TrackedError {
  const err = error instanceof Error ? error : new Error(String(error));
  const tracked: TrackedError = {
    id: generateId(),
    message: err.message,
    stack: err.stack,
    timestamp: Date.now(),
    severity: "error",
    context: {
      ...context,
      breadcrumbs: [...breadcrumbs],
    },
  };

  errors.push(tracked);
  if (errors.length > MAX_ERRORS) {
    errors = errors.slice(-MAX_ERRORS);
  }

  // Persist to sessionStorage
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(errors));
  } catch {}

  console.error(`[ErrorTracking] ${err.message}`, context);
  return tracked;
}

export function captureMessage(
  message: string,
  severity: TrackedError["severity"] = "info",
  context?: Record<string, unknown>
): TrackedError {
  const tracked: TrackedError = {
    id: generateId(),
    message,
    timestamp: Date.now(),
    severity,
    context,
  };

  errors.push(tracked);
  if (errors.length > MAX_ERRORS) {
    errors = errors.slice(-MAX_ERRORS);
  }

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(errors));
  } catch {}

  return tracked;
}

export function getTrackedErrors(): TrackedError[] {
  return [...errors];
}

export function getBreadcrumbs(): Breadcrumb[] {
  return [...breadcrumbs];
}

export function clearErrors() {
  errors = [];
  breadcrumbs = [];
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function exportErrorLog(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      errors,
      breadcrumbs,
      userAgent: navigator.userAgent,
      url: window.location.href,
    },
    null,
    2
  );
}

// Restore from session on load
try {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) errors = JSON.parse(stored);
} catch {}
