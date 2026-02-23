import { useEffect, useState } from 'react';
import { SubscriptionTier } from '@/lib/subscriptionHelper';

interface AuthUser {
  id: string;
  email?: string;
  subscription_tier: SubscriptionTier;
  subscription_status?: 'active' | 'paused' | 'expired' | 'cancelled';
  subscription_expires_at?: string;
}

/**
 * Simple auth hook for subscription tier access
 * TODO: Connect to actual Supabase auth and user_profiles table
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Replace with actual Supabase auth check
    // For now, check localStorage for demo/testing
    try {
      const storedUser = localStorage.getItem('defixlama_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Default to free tier if no user
        setUser(null);
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    subscription_tier: user?.subscription_tier || 'free',
  };
}

/**
 * Helper to set user in localStorage for testing
 */
export function setTestUser(tier: SubscriptionTier = 'pro') {
  const testUser: AuthUser = {
    id: 'test-user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    subscription_tier: tier,
    subscription_status: 'active',
  };
  localStorage.setItem('defixlama_user', JSON.stringify(testUser));
  window.location.reload();
}

/**
 * Helper to clear test user
 */
export function clearTestUser() {
  localStorage.removeItem('defixlama_user');
  window.location.reload();
}
