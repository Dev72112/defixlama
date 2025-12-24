import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateRange = "7d" | "30d" | "90d" | "1y" | "all";

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const ranges: { value: DateRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
];

export function DateRangeSelector({ value, onChange, className }: DateRangeSelectorProps) {
  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-lg bg-muted/50", className)}>
      <Calendar className="h-4 w-4 text-muted-foreground ml-2 mr-1" />
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(range.value)}
          className={cn(
            "h-7 px-3 text-xs font-medium",
            value === range.value && "bg-primary text-primary-foreground"
          )}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}

// Helper to filter data by date range
export function filterByDateRange<T extends { date?: number }>(
  data: T[],
  range: DateRange
): T[] {
  if (!data || data.length === 0) return [];
  if (range === "all") return data;

  const now = Math.floor(Date.now() / 1000);
  const days = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  };

  const cutoff = now - days[range] * 86400;
  return data.filter((item) => (item.date || 0) >= cutoff);
}
