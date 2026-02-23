/**
 * Zod validation schemas for all external API responses
 * Ensures data integrity and type safety
 */

import { z } from 'zod';

// ============================================================================
// DefiLlama Protocol Schemas
// ============================================================================

export const DefiLlamaProtocolSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().url().optional(),
  slug: z.string(),
  chainTvls: z.record(z.number()).optional(),
  tvl: z.number().optional(),
  chainTvlUsd: z.record(z.number()).optional(),
  tvlUsd: z.number().optional(),
  change_1h: z.number().optional().nullable(),
  change_1d: z.number().optional().nullable(),
  change_7d: z.number().optional().nullable(),
  chains: z.array(z.string()).optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  twitter: z.string().optional(),
  symbol: z.string().optional(),
  category: z.string().optional(),
});

export type DefiLlamaProtocol = z.infer<typeof DefiLlamaProtocolSchema>;

export const DefiLlamaProtocolArraySchema = z.array(DefiLlamaProtocolSchema);

// ============================================================================
// CoinGecko Token Schemas
// ============================================================================

export const CoinGeckoTokenSchema = z.object({
  id: z.string(),
  symbol: z.string().toUpperCase(),
  name: z.string(),
  image: z.string().url().optional(),
  current_price: z.number().nullable().optional(),
  market_cap: z.number().nullable().optional(),
  market_cap_rank: z.number().nullable().optional(),
  total_volume: z.number().nullable().optional(),
  high_24h: z.number().nullable().optional(),
  low_24h: z.number().nullable().optional(),
  price_change_24h: z.number().nullable().optional(),
  price_change_percentage_24h: z.number().nullable().optional(),
  price_change_percentage_7d: z.number().nullable().optional(),
  price_change_percentage_30d: z.number().nullable().optional(),
  price_change_percentage_1y: z.number().nullable().optional(),
  market_cap_change_24h: z.number().nullable().optional(),
  market_cap_change_percentage_24h: z.number().nullable().optional(),
  circulating_supply: z.number().nullable().optional(),
  total_supply: z.number().nullable().optional(),
  max_supply: z.number().nullable().optional(),
  ath: z.number().nullable().optional(),
  atl: z.number().nullable().optional(),
  last_updated: z.string().datetime().optional(),
});

export type CoinGeckoToken = z.infer<typeof CoinGeckoTokenSchema>;

export const CoinGeckoTokenArraySchema = z.array(CoinGeckoTokenSchema);

// ============================================================================
// OKLink API Schemas
// ============================================================================

export const OKLinkTokenInfoSchema = z.object({
  symbol: z.string().optional(),
  name: z.string().optional(),
  logo: z.string().url().optional(),
  contractLogo: z.string().url().optional(),
  description: z.string().optional(),
  contractName: z.string().optional(),
  totalSupply: z.string().optional(),
  holders: z.number().optional(),
  price: z.number().optional(),
  priceUsd: z.string().optional(),
  change24h: z.number().optional(),
  volume24h: z.number().optional(),
  marketCap: z.number().optional(),
});

export type OKLinkTokenInfo = z.infer<typeof OKLinkTokenInfoSchema>;

// ============================================================================
// DEX & Swap Schemas
// ============================================================================

export const DexVolumeSchema = z.object({
  name: z.string(),
  logo: z.string().url().optional(),
  totalVolume: z.number().optional(),
  volume24h: z.number().optional(),
  volumeChange: z.number().optional(),
  chains: z.array(z.string()).optional(),
  fees: z.number().optional(),
});

export type DexVolume = z.infer<typeof DexVolumeSchema>;

// ============================================================================
// Yield/APY Schemas
// ============================================================================

export const YieldPoolSchema = z.object({
  pool: z.string(),
  chain: z.string(),
  protocol: z.string(),
  symbol: z.string().optional(),
  tvlUsd: z.number().optional(),
  apy: z.number().nullable().optional(),
  apyBase: z.number().nullable().optional(),
  apyReward: z.number().nullable().optional(),
  rewardTokens: z.array(z.string()).optional(),
  underlyingTokens: z.array(z.string()).optional(),
  outlook: z.enum(['stable', 'up', 'down']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  url: z.string().url().optional(),
});

export type YieldPool = z.infer<typeof YieldPoolSchema>;

export const YieldPoolArraySchema = z.array(YieldPoolSchema);

// ============================================================================
// Stablecoin Schemas
// ============================================================================

export const StablecoinSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  address: z.string().optional(),
  chain: z.string().optional(),
  chains: z.array(z.string()).optional(),
  image: z.string().url().optional(),
  priceUsd: z.number().optional(),
  marketCap: z.number().optional(),
  updated: z.number().optional(), // Unix timestamp
  peggedUSD: z.number().optional(),
  circulatingUSD: z.number().optional(),
});

export type Stablecoin = z.infer<typeof StablecoinSchema>;

export const StablecoinArraySchema = z.array(StablecoinSchema);

// ============================================================================
// Security/Audit Schemas
// ============================================================================

export const AuditSchema = z.object({
  protocol: z.string(),
  date: z.string().optional(),
  auditFirm: z.string(),
  link: z.string().url().optional(),
  status: z.enum(['passed', 'failed', 'pending']).optional(),
});

export type Audit = z.infer<typeof AuditSchema>;

export const SecurityDataSchema = z.object({
  protocol: z.string(),
  audits: z.array(AuditSchema).optional(),
  has_governance: z.boolean().optional(),
  has_multisig: z.boolean().optional(),
  hack_history: z.array(
    z.object({
      date: z.string(),
      amount: z.number(),
      description: z.string().optional(),
    })
  ).optional(),
});

export type SecurityData = z.infer<typeof SecurityDataSchema>;

// ============================================================================
// Market/Price Chart Schemas
// ============================================================================

export const PriceChartDataSchema = z.object({
  date: z.string().datetime(),
  price: z.number().positive('Price must be positive'),
  volume: z.number().optional(),
  marketCap: z.number().optional(),
});

export type PriceChartData = z.infer<typeof PriceChartDataSchema>;

export const PriceChartArraySchema = z.array(PriceChartDataSchema);

// ============================================================================
// Chain Metrics Schemas
// ============================================================================

export const ChainMetricsSchema = z.object({
  name: z.string(),
  tvl: z.number().optional(),
  tvlChange24h: z.number().optional(),
  dominance: z.number().optional(), // percentage
  protocols: z.number().optional(),
  logo: z.string().url().optional(),
});

export type ChainMetrics = z.infer<typeof ChainMetricsSchema>;

export const ChainMetricsArraySchema = z.array(ChainMetricsSchema);

// ============================================================================
// Governance Event Schema
// ============================================================================

export const GovernanceEventSchema = z.object({
  id: z.string(),
  protocol: z.string(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['active', 'passed', 'failed', 'pending']),
  votesFor: z.number().optional(),
  votesAgainst: z.number().optional(),
  votingPower: z.number().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  link: z.string().url().optional(),
});

export type GovernanceEvent = z.infer<typeof GovernanceEventSchema>;

export const GovernanceEventArraySchema = z.array(GovernanceEventSchema);

// ============================================================================
// API Response Wrappers
// ============================================================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
    }).optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

// ============================================================================
// Validation utility function
// ============================================================================

/**
 * Safe validation that logs errors but doesn't throw
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T | null {
  const result = schema.safeParse(data);

  if (!result.success) {
    if (import.meta.env.DEV) {
      console.warn(
        `Validation error${context ? ` in ${context}` : ''}:`,
        result.error.issues
      );
    }
    return null;
  }

  return result.data as T;
}

/**
 * Strict validation that throws on error
 */
export function validateDataStrict<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data) as T;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error${context ? ` in ${context}` : ''}: ${error.errors[0]?.message}`
      );
    }
    throw error;
  }
}
