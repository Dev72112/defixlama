import { describe, it, expect, beforeEach } from "vitest";
import { captureException, captureMessage, addBreadcrumb, getTrackedErrors, clearTrackedErrors, exportErrorLog } from "@/lib/errorTracking/tracking";

describe("Error Tracking", () => {
  beforeEach(() => {
    clearTrackedErrors();
  });

  it("captures exceptions with stack traces", () => {
    const err = new Error("Test error");
    captureException(err);
    const errors = getTrackedErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe("Test error");
    expect(errors[0].type).toBe("exception");
  });

  it("captures messages", () => {
    captureMessage("Something happened", "warning");
    const errors = getTrackedErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe("Something happened");
    expect(errors[0].level).toBe("warning");
  });

  it("adds breadcrumbs", () => {
    addBreadcrumb("navigation", "Went to /dashboard");
    addBreadcrumb("click", "Clicked button");
    captureMessage("After breadcrumbs");
    const errors = getTrackedErrors();
    expect(errors[0].breadcrumbs?.length).toBeGreaterThanOrEqual(2);
  });

  it("limits stored errors to prevent memory leaks", () => {
    for (let i = 0; i < 200; i++) {
      captureMessage(`Error ${i}`);
    }
    const errors = getTrackedErrors();
    expect(errors.length).toBeLessThanOrEqual(100);
  });

  it("clears tracked errors", () => {
    captureMessage("test");
    clearTrackedErrors();
    expect(getTrackedErrors().length).toBe(0);
  });

  it("exports error log as string", () => {
    captureException(new Error("Export test"));
    const log = exportErrorLog();
    expect(typeof log).toBe("string");
    expect(log).toContain("Export test");
  });

  it("handles non-Error objects in captureException", () => {
    captureException("string error" as any);
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
