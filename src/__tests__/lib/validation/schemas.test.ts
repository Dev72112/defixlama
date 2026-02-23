import { describe, it, expect } from 'vitest';
import {
  DefiLlamaProtocolSchema,
  CoinGeckoTokenSchema,
  YieldPoolSchema,
  PriceChartDataSchema,
  validateData,
  validateDataStrict,
} from '@/lib/validation/schemas';

describe('Validation Schemas', () => {
  describe('DefiLlamaProtocolSchema', () => {
    it('should validate correct protocol data', () => {
      const data = {
        id: 'uniswap',
        name: 'Uniswap',
        slug: 'uniswap',
        tvl: 5000000,
        tvlUsd: 5000000,
        chainTvls: { ethereum: 3000000, arbitrum: 2000000 },
      };

      const result = DefiLlamaProtocolSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Uniswap');
        expect(result.data.tvl).toBe(5000000);
      }
    });

    it('should accept minimal protocol data', () => {
      const data = {
        id: 'test',
        name: 'Test Protocol',
        slug: 'test',
      };

      const result = DefiLlamaProtocolSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid TVL (string instead of number)', () => {
      const data = {
        id: 'uniswap',
        name: 'Uniswap',
        slug: 'uniswap',
        tvl: 'invalid',
      };

      const result = DefiLlamaProtocolSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const data = {
        id: 'test',
        // Missing: name, slug
      };

      const result = DefiLlamaProtocolSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('CoinGeckoTokenSchema', () => {
    it('should validate correct token data', () => {
      const data = {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        current_price: 3000,
        market_cap: 360000000000,
        total_volume: 15000000000,
        price_change_percentage_24h: 2.5,
        price_change_percentage_7d: -1.2,
      };

      const result = CoinGeckoTokenSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbol).toBe('ETH'); // Should be uppercase
        expect(result.data.current_price).toBe(3000);
      }
    });

    it('should handle null values for optional price fields', () => {
      const data = {
        id: 'test-token',
        symbol: 'test',
        name: 'Test',
        current_price: null,
        market_cap: null,
      };

      const result = CoinGeckoTokenSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid price (string instead of number)', () => {
      const data = {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        current_price: 'too expensive',
      };

      const result = CoinGeckoTokenSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('YieldPoolSchema', () => {
    it('should validate correct yield pool data', () => {
      const data = {
        pool: 'USDC/ETH',
        chain: 'ethereum',
        protocol: 'aave',
        symbol: 'aLPETH',
        tvlUsd: 1000000,
        apy: 12.5,
        apyBase: 10,
        apyReward: 2.5,
        outlook: 'up',
        confidence: 0.85,
      };

      const result = YieldPoolSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outlook).toBe('up');
        expect(result.data.confidence).toBe(0.85);
      }
    });

    it('should handle null APY', () => {
      const data = {
        pool: 'Test Pool',
        chain: 'ethereum',
        protocol: 'test',
        apy: null,
      };

      const result = YieldPoolSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid outlook value', () => {
      const data = {
        pool: 'Test',
        chain: 'ethereum',
        protocol: 'test',
        outlook: 'invalid',
      };

      const result = YieldPoolSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject confidence > 1', () => {
      const data = {
        pool: 'Test',
        chain: 'ethereum',
        protocol: 'test',
        confidence: 1.5,
      };

      const result = YieldPoolSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Validation utility functions', () => {
    it('validateData should return data on success', () => {
      const data = {
        id: 'test',
        name: 'Test',
        slug: 'test',
      };

      const result = validateData(DefiLlamaProtocolSchema, data);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test');
    });

    it('validateData should return null on failure', () => {
      const data = {
        id: 'test',
        // Missing required fields
      };

      const result = validateData(DefiLlamaProtocolSchema, data);
      expect(result).toBeNull();
    });

    it('validateDataStrict should throw on error', () => {
      const data = {
        id: 'test',
        // Missing required fields
      };

      expect(() => validateDataStrict(DefiLlamaProtocolSchema, data)).toThrow();
    });

    it('validateDataStrict should return data on success', () => {
      const data = {
        id: 'test',
        name: 'Test',
        slug: 'test',
      };

      const result = validateDataStrict(DefiLlamaProtocolSchema, data);
      expect(result.name).toBe('Test');
    });
  });

  describe('Price chart validation', () => {
    it('should validate price chart entry', () => {
      const data = {
        date: '2024-02-23T12:00:00Z',
        price: 100.5,
        volume: 50000000,
        marketCap: 5000000000,
      };

      const result = PriceChartDataSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime', () => {
      const data = {
        date: 'not-a-date',
        price: 100.5,
      };

      const result = PriceChartDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative price', () => {
      const data = {
        date: '2024-02-23T12:00:00Z',
        price: -100,
      };

      const result = PriceChartDataSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
