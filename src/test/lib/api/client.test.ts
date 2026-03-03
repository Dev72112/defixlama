import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, ApiError, sequentialFetch } from "@/lib/api/client";

describe("ApiError", () => {
  it("should create error with status and endpoint", () => {
    const err = new ApiError("Not found", 404, "/api/test", false);
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.endpoint).toBe("/api/test");
    expect(err.retryable).toBe(false);
    expect(err.name).toBe("ApiError");
  });

  it("should default retryable to false", () => {
    const err = new ApiError("fail");
    expect(err.retryable).toBe(false);
  });
});

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch JSON successfully", async () => {
    const mockData = { id: 1, name: "test" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await apiFetch("https://api.example.com/data", { retries: 0 });
    expect(result).toEqual(mockData);
  });

  it("should throw ApiError on 4xx", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(apiFetch("https://api.example.com/missing", { retries: 0 })).rejects.toThrow(ApiError);
  });

  it("should retry on 5xx errors", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        return Promise.resolve({ ok: false, status: 500, statusText: "Server Error" });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    });

    const result = await apiFetch("https://api.example.com/data", { retries: 2, retryDelay: 10 });
    expect(result).toEqual({ success: true });
    expect(callCount).toBe(3);
  });

  it("should deduplicate identical GET requests", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return new Promise((resolve) =>
        setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ n: callCount }) }), 50)
      );
    });

    const [r1, r2] = await Promise.all([
      apiFetch("https://api.example.com/dedup", { retries: 0 }),
      apiFetch("https://api.example.com/dedup", { retries: 0 }),
    ]);
    expect(r1).toEqual(r2);
    expect(callCount).toBe(1);
  });

  it("should timeout with AbortError", async () => {
    global.fetch = vi.fn().mockImplementation(
      (_, opts) =>
        new Promise((_, reject) => {
          const id = setTimeout(() => reject(new DOMException("aborted", "AbortError")), 5);
          opts?.signal?.addEventListener("abort", () => {
            clearTimeout(id);
            reject(new DOMException("aborted", "AbortError"));
          });
        })
    );

    await expect(apiFetch("https://api.example.com/slow", { timeout: 1, retries: 0 })).rejects.toThrow();
  });
});

describe("sequentialFetch", () => {
  it("should fetch items sequentially", async () => {
    const items = [1, 2, 3];
    const fetcher = vi.fn().mockImplementation((n: number) => Promise.resolve(n * 2));
    const results = await sequentialFetch(items, fetcher, 0);
    expect(results).toEqual([2, 4, 6]);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("should skip failed items", async () => {
    const items = [1, 2, 3];
    const fetcher = vi.fn().mockImplementation((n: number) => {
      if (n === 2) throw new Error("fail");
      return Promise.resolve(n * 10);
    });
    const results = await sequentialFetch(items, fetcher, 0);
    expect(results).toEqual([10, 30]);
  });
});
