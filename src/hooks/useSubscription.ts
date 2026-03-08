import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionTier = "free" | "pro" | "pro_plus" | "enterprise";

interface SubscriptionState {
  tier: SubscriptionTier;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  isLoading: boolean;
  status: string | null;
  currentPeriodEnd: Date | null;
}

// 3-month free trial from account creation
const TRIAL_DURATION_MS = 90 * 24 * 60 * 60 * 1000;

export function useSubscription(): SubscriptionState & { refetch: () => void } {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    tier: "free",
    isTrialActive: true,
    trialEndsAt: null,
    isLoading: true,
    status: null,
    currentPeriodEnd: null,
  });

  const load = useCallback(async () => {
    if (!user) {
      setState({ tier: "free", isTrialActive: true, trialEndsAt: null, isLoading: false, status: null, currentPeriodEnd: null });
      return;
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sub && (sub.status === "active" || sub.status === "trialing")) {
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
      const isExpired = periodEnd ? periodEnd < new Date() : false;

      if (!isExpired) {
        setState({
          tier: sub.tier as SubscriptionTier,
          isTrialActive: false,
          trialEndsAt: null,
          isLoading: false,
          status: sub.status,
          currentPeriodEnd: periodEnd,
        });
        return;
      }
    }

    // Fall back to trial logic
    const createdAt = new Date(user.created_at || Date.now());
    const trialEnd = new Date(createdAt.getTime() + TRIAL_DURATION_MS);
    const isTrialActive = trialEnd > new Date();

    setState({
      tier: isTrialActive ? "pro_plus" : "free",
      isTrialActive,
      trialEndsAt: trialEnd,
      isLoading: false,
      status: sub?.status || null,
      currentPeriodEnd: null,
    });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
