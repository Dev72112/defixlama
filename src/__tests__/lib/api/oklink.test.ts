import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as oklink from '@/lib/api/oklink';

describe('OKLink API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchOklinkTokenInfo', () => {
    it('should parse token info correctly', async () => {
      // Mock fetch globally
      const mockResponse = {
        result: {
          symbol: 'TEST',
          name: 'Test Token',
          price: 100.5,
          change24h: 5.2,
          volume24h: 1000000,
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await oklink.fetchOklinkTokenInfo('0x123');

      expect(result).not.toBeNull();
      expect(result?.symbol).toBe('TEST');
      expect(result?.price).toBe(100.5);
    });

    it('should return null for invalid contracts', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      );

      const result = await oklink.fetchOklinkTokenInfo('0x000');

      expect(result).toBeNull();
    });
  });

  describe('fetchOklinkLivePrice', () => {
    it('should fetch live price correctly', async () => {
      const mockResponse = {
        result: {
          symbol: 'TEST',
          price: 50.25,
          change24h: -2.1,
          volume24h: 500000,
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await oklink.fetchOklinkLivePrice('0x123');

      expect(result).not.toBeNull();
      expect(result?.price).toBe(50.25);
      expect(result?.change24h).toBe(-2.1);
    });

    it('should return null if price is zero', async () => {
      const mockResponse = {
        result: {
          symbol: 'TEST',
          price: 0,
        },
      };

      global.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200 })
      );

      const result = await oklink.fetchOklinkLivePrice('0x000');

      expect(result).toBeNull();
    });
  });
});
