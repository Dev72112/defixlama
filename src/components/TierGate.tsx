import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock } from "lucide-react";

interface TierGateProps {
  children: ReactNode;
  requiredTier?: "pro" | "enterprise";
}

/**
 * TierGate wraps premium pages.
 * During the 3-month free trial, all features are unlocked.
 * After trial, it checks the user's subscription tier.
 */
export function TierGate({ children, requiredTier = "pro" }: TierGateProps) {
  // TODO: Check actual subscription status from database
  // For now, free trial = everything unlocked
  const isTrialActive = true;

  if (isTrialActive) {
    return <>{children}</>;
  }

  return <UpgradePrompt requiredTier={requiredTier} />;
}

function UpgradePrompt({ requiredTier }: { requiredTier: string }) {
  const navigate = useNavigate();

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
            {requiredTier.toUpperCase()}
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
