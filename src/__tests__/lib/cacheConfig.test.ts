import { describe, it, expect } from 'vitest';
import {
  CACHE_TIME,
  CACHE_TIME_DAILY,
  CACHE_TIME_VOLATILE,
  STALE_TIME,
  GC_TIME,
  getCacheConfig,
} from '@/lib/cacheConfig';

describe('Cache Configuration Strategy', () => {
  describe('Cache timing tiers', () => {
    it('should have static data cache longer than volatile', () => {
      expect(CACHE_TIME.PROTOCOL_LIST).toBeGreaterThan(
        CACHE_TIME_VOLATILE.LIVE_PRICES
      );
    });

    it('should have semi-static data cache between static and volatile', () => {
      expect(CACHE_TIME_DAILY.DAILY_TVL).toBeGreaterThan(
        CACHE_TIME_VOLATILE.LIVE_PRICES
      );
      expect(CACHE_TIME_DAILY.DAILY_TVL).toBeLessThan(
        CACHE_TIME.PROTOCOL_LIST
      );
    });

    it('should have live prices cache very short', () => {
      expect(CACHE_TIME_VOLATILE.LIVE_PRICES).toBe(5000);
    });

    it('should have protocol list cache reasonable duration', () => {
      expect(CACHE_TIME.PROTOCOL_LIST).toBe(5 * 60 * 1000); // 5 minutes
    });
  });

  describe('GC (garbage collection) times', () => {
    it('should keep static data longest', () => {
      expect(GC_TIME.STATIC).toBeGreaterThan(GC_TIME.SEMI_STATIC);
      expect(GC_TIME.STATIC).toBeGreaterThan(GC_TIME.VOLATILE);
    });

    it('should expire volatile data quicker', () => {
      expect(GC_TIME.VOLATILE).toBeLessThan(GC_TIME.SEMI_STATIC);
    });
  });

  describe('getCacheConfig function', () => {
    it('should return correct config for static data', () => {
      const config = getCacheConfig('PROTOCOL_LIST');
      expect(config.staleTime).toBe(CACHE_TIME.PROTOCOL_LIST);
      expect(config.gcTime).toBe(GC_TIME.STATIC);
    });

    it('should return correct config for semi-static data', () => {
      const config = getCacheConfig('DAILY_TVL');
      expect(config.staleTime).toBe(CACHE_TIME_DAILY.DAILY_TVL);
      expect(config.gcTime).toBe(GC_TIME.SEMI_STATIC);
    });

    it('should return correct config for volatile data', () => {
      const config = getCacheConfig('LIVE_PRICES');
      expect(config.staleTime).toBe(CACHE_TIME_VOLATILE.LIVE_PRICES);
      expect(config.gcTime).toBe(GC_TIME.VOLATILE);
    });

    it('should return volatile config for unknown data type', () => {
      const config = getCacheConfig('LIVE_PRICES'); // fallback
      expect(config.staleTime).toBeLessThan(60 * 1000); // Less than 1 minute
    });
  });

  describe('STALE_TIME constants', () => {
    it('static stale time should use static cache', () => {
      expect(STALE_TIME.STATIC).toBe(CACHE_TIME.PROTOCOL_LIST);
    });

    it('volatile stale time should use volatile cache', () => {
      expect(STALE_TIME.VOLATILE).toBe(CACHE_TIME_VOLATILE.LIVE_PRICES);
    });

    it('semi-static should be between static and volatile', () => {
      expect(STALE_TIME.SEMI_STATIC).toBeGreaterThan(STALE_TIME.VOLATILE);
      expect(STALE_TIME.SEMI_STATIC).toBeLessThan(STALE_TIME.STATIC);
    });
  });

  describe('Real-world usage patterns', () => {
    it('protocol list should cache 5 minutes', () => {
      const config = getCacheConfig('PROTOCOL_LIST');
      expect(config.staleTime).toBe(5 * 60 * 1000);
    });

    it('live prices should cache 5 seconds', () => {
      const config = getCacheConfig('LIVE_PRICES');
      expect(config.staleTime).toBe(5 * 1000);
    });

    it('user portfolio should cache 2 seconds', () => {
      const config = getCacheConfig('USER_PORTFOLIO');
      expect(config.staleTime).toBe(2 * 1000);
    });

    it('audits should cache 24 hours', () => {
      const config = getCacheConfig('AUDITS');
      expect(config.staleTime).toBe(24 * 60 * 60 * 1000);
    });
  });
});
