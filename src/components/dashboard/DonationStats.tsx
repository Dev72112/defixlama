import { Heart, Users, Target, TrendingUp } from "lucide-react";

interface DonationStatsProps {
  totalDonations?: number;
  donorCount?: number;
  monthlyGoal?: number;
  growthRate?: number;
}

export function DonationStats({
  totalDonations = 0,
  donorCount = 0,
  monthlyGoal = 1000,
  growthRate = 0,
}: DonationStatsProps) {
  const progress = monthlyGoal > 0 ? Math.min((totalDonations / monthlyGoal) * 100, 100) : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground">Funding Progress</h3>
        <Heart className="h-5 w-5 text-destructive" />
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Monthly Goal</span>
          <span className="font-medium text-foreground">${totalDonations.toLocaleString()} / ${monthlyGoal.toLocaleString()}</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% of monthly goal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <Users className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{donorCount}</p>
          <p className="text-xs text-muted-foreground">Donors</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <Target className="h-5 w-5 text-success mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">${totalDonations}</p>
          <p className="text-xs text-muted-foreground">Raised</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-muted/30">
          <TrendingUp className="h-5 w-5 text-warning mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{growthRate}%</p>
          <p className="text-xs text-muted-foreground">Growth</p>
        </div>
      </div>
    </div>
  );
}
