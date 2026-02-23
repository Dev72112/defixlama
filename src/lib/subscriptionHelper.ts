/**
 * Subscription Tier Gating System
 * Determines which features are available for each subscription tier
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise' | undefined;

export type FeatureKey =
  // Free features
  | 'watchlist_basic'
  | 'basic_browsing'
  | 'price_charts'
  | 'basic_alerts'
  | 'api_basic' // 100 req/day

  // Pro features
  | 'portfolio_tracking'
  | 'portfolio_dashboard'
  | 'whale_tracking'
  | 'backtester'
  | 'risk_dashboard'
  | 'yield_intelligence'
  | 'market_structure'
  | 'api_pro' // 10,000 req/day
  | 'advanced_yield_optimizer'
  | 'governance_tracking'
  | 'advanced_alerts'

  // Enterprise features
  | 'portfolio_optimizer'
  | 'correlation_analysis'
  | 'tax_reporting'
  | 'advanced_backtesting'
  | 'custom_dashboards'
  | 'sentiment_analytics'
  | 'api_enterprise' // unlimited
  | 'unlimited_alerts'
  | 'advanced_webhooks'
  | 'custom_integrations';

/**
 * Feature matrix defining which tiers have access to each feature
 */
const FEATURE_TIERS: Record<FeatureKey, SubscriptionTier[]> = {
  // Free tier features
  watchlist_basic: ['free', 'pro', 'enterprise'],
  basic_browsing: ['free', 'pro', 'enterprise'],
  price_charts: ['free', 'pro', 'enterprise'],
  basic_alerts: ['pro', 'enterprise'], // 1 alert for free
  api_basic: ['free', 'pro', 'enterprise'],

  // Pro tier features
  portfolio_tracking: ['pro', 'enterprise'],
  portfolio_dashboard: ['pro', 'enterprise'],
  whale_tracking: ['pro', 'enterprise'],
  backtester: ['pro', 'enterprise'],
  risk_dashboard: ['pro', 'enterprise'],
  yield_intelligence: ['pro', 'enterprise'],
  market_structure: ['pro', 'enterprise'],
  api_pro: ['pro', 'enterprise'],
  advanced_yield_optimizer: ['pro', 'enterprise'],
  governance_tracking: ['pro', 'enterprise'],
  advanced_alerts: ['pro', 'enterprise'], // 10+ alerts

  // Enterprise tier features
  portfolio_optimizer: ['enterprise'],
  correlation_analysis: ['enterprise'],
  tax_reporting: ['enterprise'],
  advanced_backtesting: ['enterprise'],
  custom_dashboards: ['enterprise'],
  sentiment_analytics: ['enterprise'],
  api_enterprise: ['enterprise'],
  unlimited_alerts: ['enterprise'],
  advanced_webhooks: ['enterprise'],
  custom_integrations: ['enterprise'],
};

/**
 * Check if a user with the given tier can access a specific feature
 */
export function canAccessFeature(
  tier: SubscriptionTier,
  feature: FeatureKey
): boolean {
  const accessibleTiers = FEATURE_TIERS[feature];
  if (!accessibleTiers) {
    console.warn(`Unknown feature: ${feature}`);
    return false;
  }
  return accessibleTiers.includes(tier ?? 'free');
}

/**
 * Get the minimum tier required to access a feature
 * Returns 'free', 'pro', or 'enterprise'
 */
export function getMinimumTierForFeature(feature: FeatureKey): SubscriptionTier {
  const tiers = FEATURE_TIERS[feature];
  if (!tiers || tiers.length === 0) return 'enterprise';
  if (tiers.includes('free')) return 'free';
  if (tiers.includes('pro')) return 'pro';
  return 'enterprise';
}

/**
 * Get all features available for a given tier
 */
export function getFeaturesForTier(tier: SubscriptionTier): FeatureKey[] {
  return Object.entries(FEATURE_TIERS)
    .filter(([, tiers]) => tiers.includes(tier ?? 'free'))
    .map(([feature]) => feature as FeatureKey);
}

/**
 * Get the display name for a subscription tier
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case 'free':
      return 'Free';
    case 'pro':
      return 'Pro';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Free';
  }
}

/**
 * Get the monthly price for a tier (in USD)
 */
export function getTierPrice(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      return 0;
    case 'pro':
      return 29;
    case 'enterprise':
      return 199; // Plus custom pricing
    default:
      return 0;
  }
}

/**
 * Get API rate limits for each tier (requests per day)
 */
export function getAPIRateLimit(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      return 100;
    case 'pro':
      return 10000;
    case 'enterprise':
      return Infinity;
    default:
      return 100;
  }
}

/**
 * Get alert limits for each tier
 */
export function getAlertLimit(tier: SubscriptionTier): number {
  switch (tier) {
    case 'free':
      return 1;
    case 'pro':
      return 10;
    case 'enterprise':
      return Infinity;
    default:
      return 1;
  }
}

/**
 * Check if a tier can perform custom integrations
 */
export function supportsCustomIntegrations(tier: SubscriptionTier): boolean {
  return tier === 'enterprise';
}

/**
 * Check if a tier supports webhooks
 */
export function supportsWebhooks(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'enterprise';
}

/**
 * Check if a tier has priority support
 */
export function hasPrioritySupport(tier: SubscriptionTier): boolean {
  return tier === 'enterprise';
}

/**
 * Get upgrade recommendation for accessing a feature
 */
export function getUpgradeRecommendation(
  currentTier: SubscriptionTier,
  desiredFeature: FeatureKey
): SubscriptionTier | null {
  if (canAccessFeature(currentTier, desiredFeature)) {
    return null;
  }

  const requiredTier = getMinimumTierForFeature(desiredFeature);

  if (currentTier === 'free' && requiredTier !== 'free') {
    return 'pro'; // Recommend upgrading to Pro
  }

  if (currentTier === 'pro' && requiredTier === 'enterprise') {
    return 'enterprise'; // Recommend upgrading to Enterprise
  }

  return null;
}
