import { Gift, ExternalLink, Loader2 } from "lucide-react";
import { useDonations } from "@/hooks/useDonations";

export function RecentDonors() {
  const { data: donations = [], isLoading, isError } = useDonations();

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Recent Supporters</h3>
        <Gift className="h-5 w-5 text-primary" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Unable to load donations
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-muted-foreground text-sm">No donations yet</p>
          <p className="text-xs text-muted-foreground">Be the first to support the project!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {donations.map((donor, index) => (
            <div
              key={`${donor.txHash}-${index}`}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-xs">
                  {donor.address.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-foreground">{donor.address}</p>
                    {donor.txHash && (
                      <a
                        href={`https://www.oklink.com/xlayer/tx/${donor.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTime(donor.timestamp)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-success">
                  {donor.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{donor.token}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-4">
        {donations.length > 0 ? "Thank you to all our supporters!" : "Tracking OKB, USDT & USDG on XLayer"}
      </p>
    </div>
  );
}
