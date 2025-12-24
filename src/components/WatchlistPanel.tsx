import { useState } from "react";
import { Star, X, Trash2, TrendingUp, Layers, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useWatchlist, WatchlistItem } from "@/hooks/useWatchlist";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function WatchlistPanel() {
  const [open, setOpen] = useState(false);
  const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();

  const getIcon = (type: WatchlistItem["type"]) => {
    switch (type) {
      case "token":
        return TrendingUp;
      case "protocol":
        return Layers;
      case "dex":
        return ArrowLeftRight;
    }
  };

  const getLink = (item: WatchlistItem) => {
    switch (item.type) {
      case "token":
        return `/tokens/${item.id}`;
      case "protocol":
        return `/protocols/${item.id}`;
      case "dex":
        return `/dexs/${item.id}`;
    }
  };

  const getTypeColor = (type: WatchlistItem["type"]) => {
    switch (type) {
      case "token":
        return "bg-amber-500/10 text-amber-500";
      case "protocol":
        return "bg-primary/10 text-primary";
      case "dex":
        return "bg-blue-500/10 text-blue-500";
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Watchlist"
        >
          <Star className={cn("h-5 w-5", watchlist.length > 0 && "fill-warning text-warning")} />
          {watchlist.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-warning text-warning-foreground text-[10px] font-bold flex items-center justify-center">
              {watchlist.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[350px] sm:w-[400px]">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-warning fill-warning" />
              Watchlist
            </SheetTitle>
            {watchlist.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearWatchlist}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center">
            <Star className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-foreground mb-2">No items in watchlist</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Click the star icon on tokens, protocols, or DEXs to add them to your watchlist.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-150px)] overflow-y-auto">
            {watchlist.map((item) => {
              const Icon = getIcon(item.type);
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <Link
                    to={getLink(item)}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", getTypeColor(item.type))}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{item.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {item.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFromWatchlist(item.id, item.type)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
