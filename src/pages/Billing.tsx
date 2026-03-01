import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Check, Crown, Zap, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    active: true,
    icon: Zap,
  },
  {
    name: "Pro",
    price: "$20",
    period: "/month",
    description: "Advanced analytics & tools",
    features: [
      "Everything in Free",
      "Whale Activity tracking",
      "Market Structure analysis",
      "Yield Intelligence",
      "Correlation matrix",
      "Backtester",
      "Risk Dashboard",
      "API Access (10k req/mo)",
      "Priority support",
    ],
    cta: "3 Month Free Trial",
    active: false,
    popular: true,
    icon: Crown,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For institutions & teams",
    features: [
      "Everything in Pro",
      "Unlimited API access",
      "Custom data feeds",
      "White-label options",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Us",
    active: false,
    icon: Shield,
  },
];

export default function Billing() {
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <p className="text-xl font-bold">Free Trial</p>
              <p className="text-sm text-muted-foreground mt-1">
                All PRO features unlocked for 3 months
              </p>
            </div>
            <Badge className="bg-primary/20 text-primary px-3 py-1 text-sm">
              Active
            </Badge>
          </div>
        </Card>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <Card
                key={tier.name}
                className={cn(
                  "p-6 relative",
                  tier.popular && "border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
                )}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <div className="text-center mb-6">
                  <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  disabled={tier.active}
                >
                  {tier.cta}
                </Button>
              </Card>
            );
          })}
        </div>

        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            💳 Payment processing coming soon. All PRO features are currently available during the free trial period.
          </p>
        </Card>
      </div>
    </Layout>
  );
}
