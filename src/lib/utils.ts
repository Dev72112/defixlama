import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Strip HTML tags from a string (simple sanitizer for descriptions)
export function stripHtml(input: string | undefined | null): string {
  if (!input) return "";
  // Remove script/style tags and their content
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--.*?-->/gs, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

export function safeEncode(input: string | undefined | null): string {
  if (!input) return "";
  return encodeURIComponent(input);
}

// Format token price for display, handling very small values
export function formatTokenPrice(value: number | undefined): string {
  if (value === undefined || value === null || isNaN(value)) return "-";
  if (value >= 1) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (value === 0) return "$0";
  // for small prices, show up to 8 decimals but trim trailing zeros
  const s = value.toFixed(8).replace(/(?:\.0+|(?<=\.[0-9]*?)0+)$/g, "");
  return `$${s}`;
}
