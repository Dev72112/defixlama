import { ReactNode } from "react";
import { Crown, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";

const tierLevel: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  pro_plus: 2,
  enterprise: 3,
};

interface ProDetailSectionProps {
  title: string;
  children: ReactNode;
  requiredTier?: "pro" | "pro_plus";
}

export function ProDetailSection({ title, children, requiredTier = "pro" }: ProDetailSectionProps) {
  const { tier, isTrialActive, isLoading, isAdmin } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) return null;

  // Trial respects tier hierarchy — trial sets tier:"pro" so Pro+ sections stay locked
  const hasAccess = isAdmin || tierLevel[tier] >= tierLevel[requiredTier];
  const tierLabel = requiredTier === "pro_plus" ? "PRO+" : "PRO";

  if (!hasAccess) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-6 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Badge className="bg-primary/20 text-primary text-[10px]">
            <Crown className="h-3 w-3 mr-1" />
            {tierLabel}
          </Badge>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Lock className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Unlock advanced {title.toLowerCase()} with a {tierLabel} subscription
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate("/billing")}>
            Upgrade to {tierLabel}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <Badge className="bg-primary/20 text-primary text-[10px]">
          <Crown className="h-3 w-3 mr-1" />
          {tierLabel}
        </Badge>
      </div>
      {children}
    </div>
  );
}
