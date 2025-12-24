import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchlist, WatchlistItem } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface WatchlistButtonProps {
  item: Omit<WatchlistItem, "addedAt">;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "ghost" | "outline" | "default";
  showLabel?: boolean;
  className?: string;
}

export function WatchlistButton({
  item,
  size = "icon",
  variant = "ghost",
  showLabel = false,
  className,
}: WatchlistButtonProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const isWatched = isInWatchlist(item.id, item.type);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWatchlist(item);
    
    toast({
      title: isWatched ? "Removed from watchlist" : "Added to watchlist",
      description: `${item.symbol} has been ${isWatched ? "removed from" : "added to"} your watchlist.`,
      duration: 2000,
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        "transition-all",
        isWatched && "text-warning",
        className
      )}
      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Star className={cn("h-4 w-4", isWatched && "fill-warning")} />
      {showLabel && (
        <span className="ml-1">{isWatched ? "Watching" : "Watch"}</span>
      )}
    </Button>
  );
}
