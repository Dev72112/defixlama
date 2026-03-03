import { describe, it, expect } from "vitest";
import {
  defillamaProtocolSchema,
  coingeckoPriceSchema,
  validateData,
  validateDataStrict,
  validateArray,
} from "@/lib/validation/schemas";

describe("defillamaProtocolSchema", () => {
  it("should validate a valid protocol", () => {
    const data = { name: "Aave", symbol: "AAVE", tvl: 1e10, category: "Lending", chains: ["Ethereum"] };
    const result = defillamaProtocolSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should allow nullable fields", () => {
    const data = { name: "Test", symbol: null, tvl: null, category: null };
    const result = defillamaProtocolSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should fail without name", () => {
    const data = { symbol: "X", tvl: 100 };
    const result = defillamaProtocolSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("should allow optional fields to be omitted", () => {
    const data = { name: "Minimal" };
    const result = defillamaProtocolSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe("coingeckoPriceSchema", () => {
  it("should validate a full CoinGecko entry", () => {
    const data = {
      id: "bitcoin", symbol: "btc", name: "Bitcoin",
      current_price: 65000, price_change_percentage_24h: 2.5,
      market_cap: 1.2e12, total_volume: 3e10, image: "https://example.com/btc.png",
    };
    const result = coingeckoPriceSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should allow null prices", () => {
    const data = { id: "x", symbol: "x", name: "X", current_price: null };
    const result = coingeckoPriceSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("should fail without required fields", () => {
    const result = coingeckoPriceSchema.safeParse({ id: "x" });
    expect(result.success).toBe(false);
  });
});

describe("validateData", () => {
  it("should return parsed data on success", () => {
    const result = validateData(defillamaProtocolSchema, { name: "Test" });
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Test");
  });

  it("should return null on failure", () => {
    const result = validateData(defillamaProtocolSchema, { tvl: 100 });
    expect(result).toBeNull();
  });
});

describe("validateDataStrict", () => {
  it("should throw on invalid data", () => {
    expect(() => validateDataStrict(defillamaProtocolSchema, {})).toThrow();
  });

  it("should return data on valid input", () => {
    const result = validateDataStrict(defillamaProtocolSchema, { name: "Ok" });
    expect(result.name).toBe("Ok");
  });
});

describe("validateArray", () => {
  it("should filter out invalid items", () => {
    const items = [
      { name: "Good" },
      { tvl: 100 },
      { name: "Also Good", tvl: 500 },
    ];
    const result = validateArray(defillamaProtocolSchema, items);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Good");
    expect(result[1].name).toBe("Also Good");
  });

  it("should return empty array if all invalid", () => {
    const result = validateArray(defillamaProtocolSchema, [{ x: 1 }, { y: 2 }]);
    expect(result).toEqual([]);
  });

  it("should handle empty array", () => {
    const result = validateArray(defillamaProtocolSchema, []);
    expect(result).toEqual([]);
  });
});
