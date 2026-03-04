import { describe, it, expect } from "vitest";
import { cn, stripHtml, safeEncode, formatTokenPrice } from "@/lib/utils";

describe("cn utility", () => {
  it("merges class names", () => {
    const result = cn("px-4", "py-2");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "visible");
    expect(result).toContain("base");
    expect(result).toContain("visible");
    expect(result).not.toContain("hidden");
  });

  it("deduplicates tailwind classes", () => {
    const result = cn("px-4", "px-2");
    expect(result).toBe("px-2");
  });
});

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello");
  });

  it("handles null/undefined", () => {
    expect(stripHtml(null)).toBe("");
    expect(stripHtml(undefined)).toBe("");
  });
});

describe("safeEncode", () => {
  it("encodes special characters", () => {
    expect(safeEncode("hello world")).toBe("hello%20world");
  });

  it("handles null", () => {
    expect(safeEncode(null)).toBe("");
  });
});

describe("formatTokenPrice", () => {
  it("formats large prices", () => {
    expect(formatTokenPrice(1234.56)).toBe("$1,234.56");
  });

  it("handles zero", () => {
    expect(formatTokenPrice(0)).toBe("$0");
  });

  it("handles undefined", () => {
    expect(formatTokenPrice(undefined)).toBe("-");
  });

  it("formats small prices with decimals", () => {
    const result = formatTokenPrice(0.00001234);
    expect(result).toContain("$");
    expect(result).toContain("1234");
  });
});
