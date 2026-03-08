import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SubscriptionTier = "free" | "pro" | "pro_plus" | "enterprise";

interface SubscriptionState {
  tier: SubscriptionTier;
  isTrialActive: boolean;
  trialEndsAt: Date | null;
  isLoading: boolean;
  status: string | null;
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
    status: null,
  });

  useEffect(() => {
    if (!user) {
      setState({ tier: "free", isTrialActive: true, trialEndsAt: null, isLoading: false, status: null });
      return;
    }

    const load = async () => {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (sub && (sub.status === "active" || sub.status === "trialing")) {
        const isExpired = sub.current_period_end
          ? new Date(sub.current_period_end) < new Date()
          : false;

        if (!isExpired) {
          setState({
            tier: sub.tier as SubscriptionTier,
            isTrialActive: false,
            trialEndsAt: null,
            isLoading: false,
            status: sub.status,
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
      });
    };

    load();
  }, [user]);

  return state;
}
