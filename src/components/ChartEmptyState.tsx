import { BarChart3 } from "lucide-react";

interface ChartEmptyStateProps {
  message?: string;
  height?: string;
}

export function ChartEmptyState({ message = "No data available", height = "h-[200px]" }: ChartEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${height} text-muted-foreground gap-2`}>
      <BarChart3 className="h-8 w-8 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
