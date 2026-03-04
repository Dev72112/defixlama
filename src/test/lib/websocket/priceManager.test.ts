import { describe, it, expect, vi, beforeEach } from "vitest";
import { PriceManager } from "@/lib/websocket/priceManager";

describe("PriceManager", () => {
  let manager: PriceManager;

  beforeEach(() => {
    manager = new PriceManager();
  });

  it("creates a PriceManager instance", () => {
    expect(manager).toBeDefined();
  });

  it("subscribes to price updates", () => {
    const callback = vi.fn();
    const unsub = manager.subscribe("bitcoin", callback);
    expect(typeof unsub).toBe("function");
  });

  it("unsubscribes cleanly", () => {
    const callback = vi.fn();
    const unsub = manager.subscribe("bitcoin", callback);
    unsub();
    // Should not throw
    expect(true).toBe(true);
  });

  it("tracks subscriptions", () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    manager.subscribe("bitcoin", cb1);
    manager.subscribe("ethereum", cb2);
    expect(manager.getSubscriptionCount()).toBe(2);
  });

  it("removes subscription on unsub", () => {
    const cb = vi.fn();
    const unsub = manager.subscribe("bitcoin", cb);
    unsub();
    expect(manager.getSubscriptionCount()).toBe(0);
  });

  it("supports destroy/cleanup", () => {
    manager.subscribe("bitcoin", vi.fn());
    manager.destroy();
    expect(manager.getSubscriptionCount()).toBe(0);
  });
});
