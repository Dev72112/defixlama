import { describe, it, expect } from "vitest";
import { CACHE_TIERS, getCacheConfig } from "@/lib/cacheConfig";

describe("CACHE_TIERS", () => {
  it("should have 3 tiers", () => {
    expect(Object.keys(CACHE_TIERS)).toHaveLength(3);
    expect(CACHE_TIERS).toHaveProperty("STATIC");
    expect(CACHE_TIERS).toHaveProperty("SEMI_STATIC");
    expect(CACHE_TIERS).toHaveProperty("VOLATILE");
  });

  it("STATIC should have longest staleTime", () => {
    expect(CACHE_TIERS.STATIC.staleTime).toBeGreaterThan(CACHE_TIERS.SEMI_STATIC.staleTime);
    expect(CACHE_TIERS.STATIC.staleTime).toBeGreaterThan(CACHE_TIERS.VOLATILE.staleTime);
  });

  it("VOLATILE should have shortest staleTime", () => {
    expect(CACHE_TIERS.VOLATILE.staleTime).toBeLessThan(CACHE_TIERS.SEMI_STATIC.staleTime);
  });

  it("VOLATILE should have refetchInterval", () => {
    expect(CACHE_TIERS.VOLATILE).toHaveProperty("refetchInterval");
    expect(CACHE_TIERS.VOLATILE.refetchInterval).toBeGreaterThan(0);
  });

  it("STATIC should not refetch on window focus", () => {
    expect(CACHE_TIERS.STATIC.refetchOnWindowFocus).toBe(false);
  });
});

describe("getCacheConfig", () => {
  it("should return correct config for each tier", () => {
    expect(getCacheConfig("STATIC")).toBe(CACHE_TIERS.STATIC);
    expect(getCacheConfig("SEMI_STATIC")).toBe(CACHE_TIERS.SEMI_STATIC);
    expect(getCacheConfig("VOLATILE")).toBe(CACHE_TIERS.VOLATILE);
  });

  it("SEMI_STATIC should refetch on window focus", () => {
    const config = getCacheConfig("SEMI_STATIC");
    expect(config.refetchOnWindowFocus).toBe(true);
  });

  it("gcTime should be greater than staleTime for all tiers", () => {
    for (const tier of Object.keys(CACHE_TIERS) as Array<keyof typeof CACHE_TIERS>) {
      const config = getCacheConfig(tier);
      expect(config.gcTime).toBeGreaterThan(config.staleTime);
    }
  });
});
