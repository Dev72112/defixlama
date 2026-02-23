import { Link } from 'react-router-dom';
import { Lock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTierDisplayName, getTierPrice } from '@/lib/subscriptionHelper';
import { SubscriptionTier } from '@/lib/subscriptionHelper';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  feature: string;
  currentTier?: SubscriptionTier;
  requiredTier?: SubscriptionTier;
  description?: string;
  fullScreen?: boolean;
}

export function UpgradePrompt({
  feature,
  currentTier = 'free',
  requiredTier = 'pro',
  description,
  fullScreen = true,
}: UpgradePromptProps) {
  const requiredPrice = getTierPrice(requiredTier);
  const displayTier = getTierDisplayName(requiredTier);

  if (fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <Lock className="relative h-16 w-16 text-primary" />
        </div>

        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-2xl font-bold text-foreground">{feature}</h2>
          <p className="text-sm text-muted-foreground">
            {description || `This feature is exclusive to ${displayTier} subscribers`}
          </p>
        </div>

        <Card className="w-full max-w-md p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Unlock with {displayTier}</span>
              <span className="text-lg font-bold text-primary">
                ${requiredPrice}/mo
              </span>
            </div>

            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-foreground">
                <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                Access {feature}
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4 flex-shrink-0" />
                Portfolio tracking & optimization
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4 flex-shrink-0" />
                Whale activity monitoring
              </li>
              {requiredTier === 'enterprise' && (
                <>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4 flex-shrink-0" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4 flex-shrink-0" />
                    Custom integrations
                  </li>
                </>
              )}
            </ul>

            <Button asChild className="w-full">
              <Link to="/billing">Upgrade Now</Link>
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              30-day free trial available
            </p>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground text-center max-w-md">
          Questions? Contact our support team at support@defixlama.com
        </p>
      </div>
    );
  }

  // Compact card version
  return (
    <Card className="p-6 border-amber-500/30 bg-amber-500/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Lock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">{feature} Required</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {description || `This feature requires a ${displayTier} subscription ($${requiredPrice}/month)`}
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to="/billing">Upgrade</Link>
        </Button>
      </div>
    </Card>
  );
}

/**
 * Hook to easily check if user can access a feature and show prompt if not
 * Usage: const canAccess = useFeatureAccess('portfolio_optimizer');
 */
export function useFeatureAccess(
  featureKey: string,
  userTier?: SubscriptionTier
): boolean {
  // TODO: Get actual user tier from auth context
  // For now, using prop or defaulting to 'free'
  const tier = userTier || 'free';

  // Import canAccessFeature from subscriptionHelper
  const { canAccessFeature } = require('@/lib/subscriptionHelper');
  return canAccessFeature(tier, featureKey);
}
