import { Card } from "@/components/ui/card";
import { useDonationLeaderboard, getExplorerAddressLink } from "@/hooks/useDonations";
import { Trophy, Medal, Award, ExternalLink, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const badgeConfig = {
  whale: { label: "Whale", icon: Crown, color: "text-amber-500 bg-amber-500/10" },
  supporter: { label: "Supporter", icon: Medal, color: "text-blue-500 bg-blue-500/10" },
  contributor: { label: "Contributor", icon: Award, color: "text-emerald-500 bg-emerald-500/10" },
};

export function DonationLeaderboard() {
  const { data: leaderboard, isLoading, isError } = useDonationLeaderboard();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Top Donors</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (isError || !leaderboard) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Top Donors</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">Unable to load leaderboard</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Trophy className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Top Donors</h3>
          <p className="text-xs text-muted-foreground">All-time contribution rankings</p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No donations yet</p>
          <p className="text-xs text-muted-foreground mt-1">Be the first to support!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.slice(0, 10).map((donor, index) => {
            const badge = badgeConfig[donor.badge];
            const BadgeIcon = badge.icon;
            
            return (
              <div
                key={donor.fullAddress}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg transition-colors",
                  index === 0 && "bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20",
                  index === 1 && "bg-gradient-to-r from-slate-400/10 to-transparent border border-slate-400/20",
                  index === 2 && "bg-gradient-to-r from-orange-600/10 to-transparent border border-orange-600/20",
                  index > 2 && "hover:bg-muted/50"
                )}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && (
                    <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
                  )}
                </div>

                {/* Address */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm text-foreground">{donor.address}</code>
                    <a
                      href={getExplorerAddressLink(donor.fullAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary/60 hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", badge.color)}>
                      <BadgeIcon className="h-3 w-3" />
                      {badge.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {donor.donationCount} donation{donor.donationCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="font-mono font-semibold text-foreground">
                    ${donor.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leaderboard.length > 10 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          +{leaderboard.length - 10} more donors
        </p>
      )}
    </Card>
  );
}
