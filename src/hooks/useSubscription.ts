import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionTier = "free" | "pro" | "enterprise";

interface SubscriptionState {
  tier: SubscriptionTier;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  isLoading: boolean;
}

// 3-month free trial from account creation
const TRIAL_DURATION_MS = 90 * 24 * 60 * 60 * 1000;

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    tier: "free",
    isTrialActive: true,
    trialEndsAt: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!user) {
      setState({ tier: "free", isTrialActive: true, trialEndsAt: null, isLoading: false });
      return;
    }

    // For now, all users get free trial (everything unlocked)
    // When subscriptions table exists, this will query it
    const createdAt = new Date(user.created_at || Date.now());
    const trialEnd = new Date(createdAt.getTime() + TRIAL_DURATION_MS);
    const isTrialActive = trialEnd > new Date();

    setState({
      tier: isTrialActive ? "pro" : "free",
      isTrialActive,
      trialEndsAt: trialEnd,
      isLoading: false,
    });
  }, [user]);

  return state;
}
