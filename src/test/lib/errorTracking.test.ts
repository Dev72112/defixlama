import { describe, it, expect, beforeEach } from "vitest";
import { captureException, captureMessage, addBreadcrumb, getTrackedErrors, clearErrors, exportErrorLog } from "@/lib/errorTracking/tracking";

describe("Error Tracking", () => {
  beforeEach(() => {
    clearErrors();
  });

  it("captures exceptions with stack traces", () => {
    const err = new Error("Test error");
    captureException(err);
    const errors = getTrackedErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe("Test error");
    expect(errors[0].severity).toBe("error");
  });

  it("captures messages", () => {
    captureMessage("Something happened", "warning");
    const errors = getTrackedErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe("Something happened");
    expect(errors[0].severity).toBe("warning");
  });

  it("adds breadcrumbs to context", () => {
    addBreadcrumb("Went to /dashboard", "navigation");
    addBreadcrumb("Clicked button", "click");
    captureException(new Error("After breadcrumbs"));
    const errors = getTrackedErrors();
    const ctx = errors[0].context as any;
    expect(ctx?.breadcrumbs?.length).toBeGreaterThanOrEqual(2);
  });

  it("limits stored errors to prevent memory leaks", () => {
    for (let i = 0; i < 200; i++) {
      captureMessage(`Error ${i}`);
    }
    const errors = getTrackedErrors();
    expect(errors.length).toBeLessThanOrEqual(50);
  });

  it("clears tracked errors", () => {
    captureMessage("test");
    clearErrors();
    expect(getTrackedErrors().length).toBe(0);
  });

  it("exports error log as string", () => {
    captureException(new Error("Export test"));
    const log = exportErrorLog();
    expect(typeof log).toBe("string");
    expect(log).toContain("Export test");
  });

  it("handles non-Error objects in captureException", () => {
    captureException("string error");
    const errors = getTrackedErrors();
    expect(errors.length).toBe(1);
  });

  it("includes timestamp in tracked errors", () => {
    captureMessage("timed");
    const errors = getTrackedErrors();
    expect(errors[0].timestamp).toBeDefined();
    expect(typeof errors[0].timestamp).toBe("number");
  });
});
