import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { getTierPrice, getAPIRateLimit, getAlertLimit, getTierDisplayName } from '@/lib/subscriptionHelper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Check, X, Download, Calendar, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for exploring DeFi',
    features: [
      'Basic protocol browsing',
      'Price charts',
      'Basic risk metrics',
      '100 API requests/day',
      '1 alert max',
      'Community access',
    ],
    notIncluded: [
      'Portfolio tracking',
      'Advanced analytics',
      'Whale monitoring',
      'Custom alerts',
      'Backtesting',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For active traders & investors',
    popular: true,
    features: [
      'Everything in Free',
      'Portfolio tracking & dashboard',
      'Whale activity monitoring',
      '10,000 API requests/day',
      '10 custom alerts',
      'Risk dashboard',
      'Yield intelligence',
      'Backtesting tools',
      'Email support',
    ],
    notIncluded: [
      'Portfolio optimization',
      'Tax reporting',
      'Custom dashboards',
      'Dedicated support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    period: 'month',
    description: 'For funds & institutions',
    features: [
      'Everything in Pro',
      'Advanced portfolio optimization',
      'Correlation analysis',
      'Tax reporting & lot tracking',
      'Custom dashboards',
      'Advanced backtesting studio',
      'Unlimited API requests',
      'Unlimited alerts',
      'SMS/Telegram notifications',
      'Custom integrations',
      'Dedicated account manager',
      'Priority phone support',
      'White-label options',
    ],
    notIncluded: [],
  },
];

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
  { id: 'crypto', name: 'Cryptocurrency', icon: '₿' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
];

export default function BillingPage() {
  const { user, subscription_tier } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [promoCode, setPromoCode] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const currentTier = subscription_tier || 'free';
  const currentTierInfo = TIERS.find((t) => t.id === currentTier);
  const renewDate = currentTier !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : null;

  return (
    <Layout>
      <div className="space-y-8 page-enter max-w-6xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gradient-primary">Billing & Subscription</h1>
          </div>
          <p className="text-muted-foreground">Manage your plan, payment methods, and invoices</p>
        </div>

        {/* Current Plan */}
        {currentTierInfo && (
          <Card className="p-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Plan</p>
                <h2 className="text-3xl font-bold text-foreground">{getTierDisplayName(currentTier)}</h2>
                <p className="text-muted-foreground mt-2">
                  {currentTier === 'free' ? 'Explore DeFi for free' : `$${getTierPrice(currentTier)}/month`}
                </p>
              </div>
              <div className="text-right">
                <Badge className="mb-3">{currentTier.toUpperCase()}</Badge>
                {renewDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2 justify-end mt-2">
                    <Calendar className="h-3 w-3" />
                    Renews {renewDate}
                  </p>
                )}
              </div>
            </div>

            {currentTier !== 'free' && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">API Requests/Day</p>
                  <p className="text-lg font-semibold text-foreground">{getAPIRateLimit(currentTier).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alert Limit</p>
                  <p className="text-lg font-semibold text-foreground">
                    {getAlertLimit(currentTier) === Infinity ? 'Unlimited' : getAlertLimit(currentTier)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Support</p>
                  <p className="text-lg font-semibold text-foreground">
                    {currentTier === 'enterprise' ? 'Priority' : 'Email'}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Tier Selection */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Choose Your Plan</h2>
            <p className="text-muted-foreground">Upgrade or downgrade anytime. Cancel at any time, no questions asked.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => {
              const isCurrent = tier.id === currentTier;
              const isSelected = tier.id === selectedTier;

              return (
                <div
                  key={tier.id}
                  className={cn(
                    'rounded-lg border-2 p-6 transition-all cursor-pointer',
                    isCurrent ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                    isSelected ? 'ring-2 ring-primary' : '',
                    tier.popular ? 'md:scale-105 md:shadow-xl' : ''
                  )}
                  onClick={() => {
                    if (tier.id !== currentTier) setSelectedTier(tier.id);
                  }}
                >
                  {tier.popular && (
                    <Badge className="mb-3">MOST POPULAR</Badge>
                  )}

                  <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">${tier.price}</span>
                    {tier.period !== 'forever' && (
                      <span className="text-muted-foreground ml-2">/{tier.period}</span>
                    )}
                  </div>

                  {isCurrent ? (
                    <Button disabled className="w-full mb-6">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        setSelectedTier(tier.id);
                        setShowPaymentModal(true);
                      }}
                      variant={tier.popular ? 'default' : 'outline'}
                      className="w-full mb-6"
                    >
                      {currentTier === 'free' ? 'Get Started' : 'Upgrade/Downgrade'}
                    </Button>
                  )}

                  <div className="space-y-3">
                    {tier.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}

                    {tier.notIncluded.length > 0 && (
                      <>
                        {tier.features.length > 0 && <div className="border-t border-border my-3" />}
                        {tier.notIncluded.map((feature) => (
                          <div key={feature} className="flex items-start gap-2 opacity-50">
                            <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        {showPaymentModal && selectedTier && selectedTier !== currentTier && (
          <Card className="p-6 border-primary/20 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      paymentMethod === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <span className="text-2xl mb-2">{method.icon}</span>
                    <p className="font-medium text-foreground text-sm">{method.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Promo Code */}
            <div>
              <Label htmlFor="promo-code" className="text-sm font-medium">
                Promo Code (Optional)
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="promo-code"
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button variant="outline">Apply</Button>
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-border pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">${getTierPrice(selectedTier as any)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (estimated)</span>
                  <span className="font-medium text-foreground">
                    ${(getTierPrice(selectedTier as any) * 0.1).toFixed(2)}
                  </span>
                </div>
                {promoCode && (
                  <div className="flex justify-between text-sm text-green-500">
                    <span>Discount (20%)</span>
                    <span>-${(getTierPrice(selectedTier as any) * 0.2).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    ${(getTierPrice(selectedTier as any) * 1.1 * (promoCode ? 0.8 : 1)).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button className="w-full mt-6">
                Complete Purchase
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment processed by Stripe. Your payment information is encrypted and secure.
            </p>
          </Card>
        )}

        {/* Invoice History */}
        <Card className="p-6 border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Invoice History</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {currentTier !== 'free' ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => {
                const date = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {currentTierInfo?.name} Subscription - {date.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Invoice #{10001 - i}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${getTierPrice(currentTier)}</p>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-muted">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">No invoices yet. Upgrade to a paid plan to start billing.</p>
            </div>
          )}
        </Card>

        {/* FAQ */}
        <Card className="p-6 border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              {
                q: 'Can I change my plan anytime?',
                a: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 30-day money-back guarantee if you\'re not satisfied. No questions asked.',
              },
              {
                q: 'Do you offer annual billing?',
                a: 'Yes! Save 20% with annual billing. Contact support for enterprise custom terms.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept credit cards, cryptocurrencies, and bank transfers. All payments are processed securely.',
              },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <p className="font-medium text-foreground">{item.q}</p>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Support CTA */}
        <div className="rounded-lg border-2 border-dashed border-primary/30 p-6 text-center space-y-4">
          <h3 className="font-semibold text-foreground">Have questions about billing?</h3>
          <p className="text-sm text-muted-foreground">Our support team is here to help. Contact us anytime.</p>
          <Button variant="outline">Email Support</Button>
        </div>
      </div>
    </Layout>
  );
}
