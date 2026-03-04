import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateShareText } from "@/lib/export";

describe("Export utilities", () => {
  it("generates protocol share text", () => {
    const text = generateShareText("protocol", { name: "Aave", tvl: 5000000, change_1d: 2.5 });
    expect(text).toContain("Aave");
    expect(text).toContain("TVL");
  });

  it("generates token share text", () => {
    const text = generateShareText("token", { name: "Bitcoin", symbol: "BTC", price: 50000, change24h: 1.5 });
    expect(text).toContain("Bitcoin");
    expect(text).toContain("BTC");
  });

  it("generates donation share text", () => {
    const text = generateShareText("donation", {});
    expect(text).toContain("Supporting");
  });

  it("generates dashboard share text", () => {
    const text = generateShareText("dashboard", { tvl: 10000000, protocols: 50, volume: 5000000 });
    expect(text).toContain("Stats");
  });

  it("returns default text for unknown types", () => {
    const text = generateShareText("unknown", {});
    expect(text).toContain("defiXlama");
  });
});
