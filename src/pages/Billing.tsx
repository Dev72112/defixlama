import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Check, Crown, Zap, Shield, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Basic DeFi analytics",
    features: [
      "Dashboard & protocol data",
      "Token prices & charts",
      "DEX volumes & TVL",
      "Chain analytics",
      "Community access",
    ],
    cta: "Current Plan",
    tierKey: "free",
    icon: Zap,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Advanced analytics & tools",
    features: [
      "Everything in Free",
      "Backtester",
      "Risk Dashboard",
      "Predictions",
      "Alert Config",
      "Governance",
      "Protocol Comparison",
      "API Access (10k req/mo)",
    ],
    cta: "Upgrade to Pro",
    tierKey: "pro",
    popular: true,
    icon: Crown,
  },
  {
    name: "Pro+",
    price: "$59",
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
    cta: "Upgrade to Pro+",
    tierKey: "pro_plus",
    icon: Sparkles,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For institutions & teams",
    features: [
      "Everything in Pro+",
      "Custom data feeds",
      "White-label options",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Coming Soon",
    tierKey: "enterprise",
    comingSoon: true,
    icon: Shield,
  },
];

export default function Billing() {
  const { tier, isTrialActive, trialEndsAt } = useSubscription();

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

        {/* Current Status */}
        <Card className="p-6 border-primary/30 bg-primary/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-xl font-bold">
                {isTrialActive ? "Free Trial (Pro+ Access)" : tier.toUpperCase()}
              </p>
              {isTrialActive && trialEndsAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Trial ends {format(trialEndsAt, "MMM d, yyyy")} — All Pro+ features unlocked
                </p>
              )}
            </div>
            <Badge className="bg-primary/20 text-primary px-3 py-1 text-sm w-fit">
              {isTrialActive ? "Trial Active" : "Active"}
            </Badge>
          </div>
        </Card>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {tiers.map((t) => {
            const Icon = t.icon;
            const isCurrentTier = !isTrialActive && tier === t.tierKey;
            const isDisabled = t.comingSoon || isCurrentTier;

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
                    <span className="text-2xl font-bold">{t.price}</span>
                    <span className="text-muted-foreground text-sm">{t.period}</span>
                  </div>
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
                  disabled={isDisabled}
                >
                  {isCurrentTier ? "Current Plan" : t.cta}
                </Button>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            💳 Payments powered by Paddle. Payment processing coming soon — all Pro+ features are currently available during the free trial period.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
