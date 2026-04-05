import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, AlertTriangle, CreditCard } from "lucide-react";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { differenceInDays, format } from "date-fns";

interface TierGateProps {
  children: ReactNode;
  requiredTier?: "pro" | "pro_plus" | "enterprise";
}

const tierLevel: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  pro_plus: 2,
  enterprise: 3,
};

export function TierGate({ children, requiredTier = "pro" }: TierGateProps) {
  const { tier, isTrialActive, isLoading, currentPeriodEnd, status, isExpired, isPendingPayment, isAdmin } = useSubscription();

  if (isLoading) return null;

  // Admins always have access
  if (isAdmin) return <>{children}</>;

  // Trial respects tier hierarchy — trial sets tier:"pro" so Pro+ stays locked
  const hasAccess = tierLevel[tier] >= tierLevel[requiredTier];

  if (!hasAccess) {
  return (
    <>
      {isExpired && <ExpiredBanner />}
      {isPendingPayment && <PendingPaymentBanner />}
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm 
                        opacity-30 max-h-[500px] overflow-hidden">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center 
                        justify-center bg-background/50 backdrop-blur-sm">
          <UpgradePrompt requiredTier={requiredTier} />
        </div>
      </div>
    </>
  );
  }

  return <>{children}</>;
}

function PendingPaymentBanner() {
  const navigate = useNavigate();

  return (
    <div className="mx-4 mt-2 mb-0">
      <Card className="p-3 border-primary/40 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
          <span>You have a pending payment. Complete your checkout to activate your subscription.</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/billing")} className="text-xs w-fit">
          Complete Payment
        </Button>
      </Card>
    </div>
  );
}

function ExpiredBanner() {
  const navigate = useNavigate();

  return (
    <div className="mx-4 mt-2 mb-0">
      <Card className="p-3 border-destructive/40 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <span>Your subscription has expired. Renew to regain access to premium features.</span>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/billing")} className="text-xs w-fit">
          Renew Now
        </Button>
      </Card>
    </div>
  );
}

function ExpiryBanner({ daysLeft, expiryDate }: { daysLeft: number; expiryDate: Date }) {
  const navigate = useNavigate();

  return (
    <div className="mx-4 mt-2 mb-0">
      <Card className="p-3 border-destructive/40 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <span>
            Your subscription expires {format(expiryDate, "MMM d")} ({daysLeft} day{daysLeft !== 1 ? "s" : ""} left).
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate("/billing")} className="text-xs w-fit">
          Renew
        </Button>
      </Card>
    </div>
  );
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
        <Button variant="ghost" onClick={() => navigate(-1 as any)} className="w-full">
          Go Back
        </Button>
      </Card>
    </div>
  );
}
