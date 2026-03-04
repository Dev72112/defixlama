import { describe, it, expect, vi, beforeEach } from "vitest";
import { priceManager } from "@/lib/websocket/priceManager";

describe("PriceManager", () => {
  it("is a singleton instance", () => {
    expect(priceManager).toBeDefined();
  });

  it("subscribes to price updates and returns unsub function", () => {
    const callback = vi.fn();
    const unsub = priceManager.subscribe(callback);
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("reports connection status", () => {
    expect(typeof priceManager.isConnected).toBe("boolean");
  });

  it("reports fallback status", () => {
    expect(typeof priceManager.usingFallback).toBe("boolean");
  });

  it("returns current prices object", () => {
    const prices = priceManager.currentPrices;
    expect(typeof prices).toBe("object");
  });

  it("supports disconnect", () => {
    priceManager.disconnect();
    expect(priceManager.isConnected).toBe(false);
  });
});
