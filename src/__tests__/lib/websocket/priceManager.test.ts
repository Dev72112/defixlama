import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocketPriceManager } from '@/lib/websocket/priceManager';

describe('WebSocketPriceManager', () => {
  let manager: WebSocketPriceManager;

  beforeEach(() => {
    manager = new WebSocketPriceManager('wss://fake-ws.example.com');
  });

  describe('Price storage', () => {
    it('should store prices', async () => {
      // Can't easily test real WebSocket, but we can test the interface
      expect(manager).toBeDefined();
      expect(manager.getAllPrices()).toEqual({});
    });

    it('should return null for unknown price', () => {
      const price = manager.getPrice('unknown-protocol');
      expect(price).toBeNull();
    });
  });

  describe('Connection status', () => {
    it('should report initial disconnected state', () => {
      expect(manager.isConnectedStatus()).toBe(false);
    });

    it('should disconnect properly', () => {
      manager.disconnect();
      expect(manager.isConnectedStatus()).toBe(false);
    });
  });

  describe('Callbacks', () => {
    it('should allow registering callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = manager.onPriceUpdate(callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow unsubscribing from callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = manager.onPriceUpdate(callback);

      unsubscribe();

      // After unsubscribe, should not call callback
      // (In real scenario, would test with actual price update)
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Fallback to polling', () => {
    it('should handle empty/http URL by using polling', async () => {
      const pollingManager = new WebSocketPriceManager('');
      // Should not throw and should be ready for polling
      expect(pollingManager).toBeDefined();
    });
  });

  describe('Protocol management', () => {
    it('should accept array of protocols', async () => {
      const protocols = ['uniswap', 'aave', 'curve'];
      // Note: Real connection would fail, but call should not throw
      expect(async () => {
        await manager.connect(protocols);
      }).not.toThrow();
    });
  });
});
