import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Check, Crown, Zap, Shield, Sparkles, Loader2, RefreshCw, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useUserCurrency } from "@/hooks/useUserCurrency";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

const tierDefinitions = [
  {
    name: "Trial",
    usdPrice: 0,
    period: "/ 7 days",
    description: "Try Pro features free for 7 days",
    features: [
      "Full Pro access for 7 days",
      "Backtester & Risk Dashboard",
      "Predictions & Governance",
      "Protocol Comparison",
      "API Access (10k req/mo)",
      "No auto-renewal",
    ],
    ctaTemplate: "Start Free Trial",
    tierKey: "trial" as const,
    icon: Clock,
  },
  {
    name: "Pro",
    usdPrice: 29,
    period: "/month",
    description: "Advanced analytics & tools",
    features: [
      "Backtester",
      "Risk Dashboard",
      "Predictions",
      "Alert Config",
      "Governance",
      "Protocol Comparison",
      "API Access (10k req/mo)",
    ],
    ctaTemplate: "Upgrade to Pro",
    tierKey: "pro" as const,
    popular: true,
    icon: Crown,
  },
  {
    name: "Pro+",
    usdPrice: 49,
    period: "/month",
    description: "Full analytics suite",
    features: [
      "Everything in Pro",
      "Whale Activity tracking",
      "Market Structure analysis",
      "Yield Intelligence",
      "Correlation matrix",
      "Community Sentiment",
      "Watchlist Exports",
      "Unlimited API access",
    ],
    ctaTemplate: "Upgrade to Pro+",
    tierKey: "pro_plus" as const,
    icon: Sparkles,
  },
  {
    name: "Enterprise",
    usdPrice: 0,
    period: "",
    description: "For institutions & teams",
    features: [
      "Everything in Pro+",
      "Custom data feeds",
      "White-label options",
      "Dedicated support",
      "SLA guarantee",
    ],
    ctaTemplate: "Coming Soon",
    tierKey: "enterprise" as const,
    comingSoon: true,
    icon: Shield,
  },
];

const TIER_RANK: Record<string, number> = { free: 0, trial: 1, pro: 1, pro_plus: 2, enterprise: 3 };

export default function Billing() {
  const { tier, isTrialActive, trialEndsAt, status, currentPeriodEnd, refetch, isExpired, isPendingPayment, isAdmin } = useSubscription();
  const { user } = useAuth();
  const { formatPrice, currency } = useUserCurrency();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);

  const paymentMode = typeof window !== 'undefined' ? (localStorage.getItem('defiXlama_paymentMode') || 'test') : 'test';
  const hasActiveSubscription = (status === "active" || status === "trialing") && !isExpired;

  useEffect(() => {
    if (searchParams.get("status") !== "success" || hasActiveSubscription) return;

    setVerifying(true);
    let attempts = 0;
    const maxAttempts = 24;

    const interval = setInterval(() => {
      attempts++;
      refetch();
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setVerifying(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [searchParams, hasActiveSubscription, refetch]);

  useEffect(() => {
    if (hasActiveSubscription && verifying) {
      setVerifying(false);
      toast.success("Payment confirmed! Your subscription is now active.");
    }
  }, [hasActiveSubscription, verifying]);

  const daysUntilExpiry = currentPeriodEnd ? differenceInDays(currentPeriodEnd, new Date()) : null;
  const isExpiringSoon = hasActiveSubscription && daysUntilExpiry !== null && daysUntilExpiry <= 7;

  const handleUpgrade = async (tierKey: "pro" | "pro_plus" | "trial") => {
    if (!user) {
      toast.error("Please sign in to upgrade");
      return;
    }

    setLoadingTier(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("yoco-checkout", {
        body: { tierKey, mode: paymentMode },
      });

      if (error) throw error;

      // Free trial — activated instantly, no redirect
      if (data?.trial && data?.success) {
        toast.success("Free trial activated! You now have Pro access for 7 days.");
        refetch();
        return;
      }

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Could not open checkout");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to create checkout");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-primary" />
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and billing details
          </p>
        </div>

        {/* Admin Mode Badge */}
        {isAdmin && (
          <div className="flex gap-3 flex-wrap">
            <Card className="p-4 border-primary/50 bg-primary/10 flex-1">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Admin Account</p>
                  <p className="text-sm text-muted-foreground">
                    You have complimentary Pro+ access as an administrator.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 border-border bg-muted/30 flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", paymentMode === 'live' ? "bg-green-500" : "bg-orange-500")} />
              <span className="text-sm font-medium text-muted-foreground">
                {paymentMode === 'live' ? 'Live' : 'Test'} Mode
              </span>
            </Card>
          </div>
        )}

        {/* Verifying Payment Banner */}
        {verifying && (
          <Card className="p-4 border-primary/50 bg-primary/10 animate-pulse">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium text-foreground">Verifying payment…</p>
                <p className="text-sm text-muted-foreground">
                  Waiting for payment confirmation. This may take a moment.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Pending Payment Banner */}
        {isPendingPayment && !verifying && (
          <Card className="p-4 border-primary/50 bg-primary/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Payment Pending</p>
                <p className="text-sm text-muted-foreground">
                  You have an incomplete checkout. Complete your payment to activate your subscription.
                </p>
              </div>
              <Button size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Check Status
              </Button>
            </div>
          </Card>
        )}

        {/* Expired Banner */}
        {isExpired && (
          <Card className="p-4 border-destructive/50 bg-destructive/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Subscription Expired</p>
                <p className="text-sm text-muted-foreground">
                  Your subscription has expired. Renew to continue accessing premium features.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleUpgrade(tier === "pro_plus" || tier === "free" ? "pro" : tier as "pro" | "pro_plus")}
                disabled={!!loadingTier}
              >
                {loadingTier ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Renew Now
              </Button>
            </div>
          </Card>
        )}

        {/* Expiry Warning Banner */}
        {isExpiringSoon && currentPeriodEnd && !isExpired && (
          <Card className="p-4 border-destructive/50 bg-destructive/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Subscription expiring soon</p>
                <p className="text-sm text-muted-foreground">
                  Your {tier === "pro_plus" ? "Pro+" : "Pro"} plan expires on{" "}
                  {format(currentPeriodEnd, "MMM d, yyyy")} ({daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""} left).
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleUpgrade(tier as "pro" | "pro_plus")}
                disabled={!!loadingTier}
              >
                {loadingTier ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Renew Now
              </Button>
            </div>
          </Card>
        )}

        {/* Current Status */}
        <Card className="p-6 border-primary/30 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-xl font-bold">
                {isAdmin
                  ? "Pro+ (Admin)"
                  : hasActiveSubscription
                  ? tier === "pro_plus" ? "Pro+" : tier.charAt(0).toUpperCase() + tier.slice(1)
                  : isTrialActive
                  ? "Trial (Pro Access)"
                  : isPendingPayment
                  ? "Payment Pending"
                  : "Free"}
              </p>
              {isTrialActive && trialEndsAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Trial ends {format(trialEndsAt, "MMM d, yyyy")} — Pro features unlocked
                </p>
              )}
              {hasActiveSubscription && currentPeriodEnd && !isTrialActive && (
                <p className="text-sm text-muted-foreground mt-1">
                  Active until {format(currentPeriodEnd, "MMM d, yyyy")}
                </p>
              )}
            </div>
            <Badge className="bg-primary/20 text-primary px-3 py-1 text-sm w-fit">
              {isAdmin ? "Admin" : hasActiveSubscription ? "Subscribed" : isTrialActive ? "Trial Active" : isPendingPayment ? "Pending" : "Free"}
            </Badge>
          </div>
        </Card>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {tierDefinitions.map((t) => {
            const Icon = t.icon;
            const isCurrentTier = !isTrialActive && tier === t.tierKey;
            const isTrialTier = t.tierKey === "trial";
            const canBuyTrial = isTrialTier && !hasActiveSubscription && !isTrialActive && !isAdmin;
            const isDisabled = t.comingSoon || isCurrentTier || isAdmin || 
              (isTrialTier && !canBuyTrial) ||
              (!isTrialTier && t.tierKey !== "enterprise" && hasActiveSubscription && TIER_RANK[t.tierKey] <= TIER_RANK[tier]);
            const isLoading = loadingTier === t.tierKey;
            const canUpgrade = !isDisabled && !t.comingSoon && t.tierKey !== "enterprise";

            const priceDisplay = t.comingSoon ? "Custom" : formatPrice(t.usdPrice);

            return (
              <Card
                key={t.name}
                className={cn(
                  "p-5 relative flex flex-col",
                  t.popular && "border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.1)]",
                  t.comingSoon && "opacity-75"
                )}
              >
                {t.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                {t.comingSoon && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground">
                    Coming Soon
                  </Badge>
                )}
                <div className="text-center mb-4">
                  <Icon className="h-7 w-7 mx-auto mb-2 text-primary" />
                  <h3 className="text-lg font-bold">{t.name}</h3>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">{priceDisplay}</span>
                    <span className="text-muted-foreground text-sm">{t.period}</span>
                  </div>
                  {!t.comingSoon && currency === 'ZAR' && (
                    <p className="text-xs text-muted-foreground mt-0.5">(${t.usdPrice} USD)</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                </div>
                <ul className="space-y-2 mb-4 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-auto"
                  variant={t.popular ? "default" : "outline"}
                  disabled={isDisabled || isLoading}
                  onClick={() => canUpgrade ? handleUpgrade(t.tierKey as "pro" | "pro_plus" | "trial") : undefined}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating checkout…</>
                  ) : isCurrentTier ? (
                    "Current Plan"
                  ) : isAdmin ? (
                    "Admin Access"
                  ) : (
                    t.ctaTemplate
                  )}
                </Button>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            💳 Secure payments powered by Yoco.{" "}
            {currency === 'ZAR' ? 'Prices shown in South African Rand. ' : ''}
            {hasActiveSubscription
              ? "Your subscription is active. Renewals are manual — you'll receive a reminder before expiry."
              : "Start with a trial to unlock Pro features for 7 days."}
          </p>
        </Card>
      </div>
    </Layout>
  );
}
