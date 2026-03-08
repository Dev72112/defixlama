import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock } from "lucide-react";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";

interface TierGateProps {
  children: ReactNode;
  requiredTier?: "pro" | "pro_plus" | "enterprise";
}

// Tier hierarchy: enterprise > pro_plus > pro > free
const tierLevel: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  pro_plus: 2,
  enterprise: 3,
};

/**
 * TierGate wraps premium pages.
 * During the 3-month free trial, all features are unlocked.
 * After trial, it checks the user's subscription tier.
 */
export function TierGate({ children, requiredTier = "pro" }: TierGateProps) {
  const { tier, isTrialActive, isLoading } = useSubscription();

  if (isLoading) {
    return null;
  }

  // Trial active = full access
  if (isTrialActive) {
    return <>{children}</>;
  }

  // Check if user's tier meets the required tier
  const hasAccess = tierLevel[tier] >= tierLevel[requiredTier];

  if (hasAccess) {
    return <>{children}</>;
  }

  return <UpgradePrompt requiredTier={requiredTier} />;
}

function UpgradePrompt({ requiredTier }: { requiredTier: string }) {
  const navigate = useNavigate();

  const tierLabel = requiredTier === "pro_plus" ? "PRO+" : requiredTier.toUpperCase();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="p-8 max-w-md text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Premium Feature</h2>
        <p className="text-muted-foreground">
          This feature requires a{" "}
          <Badge className="bg-primary/20 text-primary mx-1">
            <Crown className="h-3 w-3 mr-1" />
            {tierLabel}
          </Badge>{" "}
          subscription.
        </p>
        <Button onClick={() => navigate("/billing")} className="w-full">
          View Plans & Pricing
        </Button>
      </Card>
    </div>
  );
}
