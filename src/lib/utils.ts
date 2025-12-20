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
