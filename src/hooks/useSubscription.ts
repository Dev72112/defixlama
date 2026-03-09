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
  isExpired: boolean;
  isPendingPayment: boolean;
  isAdmin: boolean;
}

// 7-day paid trial ($1)
const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function useSubscription(): SubscriptionState & { refetch: () => void } {
  const { user, isAdmin } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    tier: "free",
    isTrialActive: false,
    trialEndsAt: null,
    isLoading: true,
    status: null,
    currentPeriodEnd: null,
    isExpired: false,
    isPendingPayment: false,
    isAdmin: false,
  });

  const load = useCallback(async () => {
    if (!user) {
      setState({ tier: "free", isTrialActive: false, trialEndsAt: null, isLoading: false, status: null, currentPeriodEnd: null, isExpired: false, isPendingPayment: false, isAdmin: false });
      return;
    }

    // Admins get free Pro+ access
    if (isAdmin) {
      setState({
        tier: "pro_plus",
        isTrialActive: false,
        trialEndsAt: null,
        isLoading: false,
        status: "active",
        currentPeriodEnd: null,
        isExpired: false,
        isPendingPayment: false,
        isAdmin: true,
      });
      return;
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sub) {
      const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
      const isExpiredNow = periodEnd ? periodEnd < new Date() : false;

      // Pending payment — user started checkout but hasn't paid
      if (sub.status === "pending" as any) {
        setState({
          tier: "free",
          isTrialActive: false,
          trialEndsAt: null,
          isLoading: false,
          status: "pending",
          currentPeriodEnd: null,
          isExpired: false,
          isPendingPayment: true,
          isAdmin: false,
        });
        return;
      }

      // Active trialing subscription (paid $1 trial)
      if (sub.status === "trialing") {
        const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
        const trialActive = trialEnd ? trialEnd > new Date() : false;

        if (trialActive) {
          setState({
            tier: (sub.tier as SubscriptionTier) || "pro",
            isTrialActive: true,
            trialEndsAt: trialEnd,
            isLoading: false,
            status: "trialing",
            currentPeriodEnd: trialEnd,
            isExpired: false,
            isPendingPayment: false,
            isAdmin: false,
          });
          return;
        }
        // Trial expired — fall through to expired logic
      }

      if ((sub.status === "active" || sub.status === "trialing") && !isExpiredNow) {
        setState({
          tier: sub.tier as SubscriptionTier,
          isTrialActive: false,
          trialEndsAt: null,
          isLoading: false,
          status: sub.status,
          currentPeriodEnd: periodEnd,
          isExpired: false,
          isPendingPayment: false,
          isAdmin: false,
        });
        return;
      }

      // Subscription exists but is expired or canceled
      if (isExpiredNow || sub.status === "canceled" || sub.status === "past_due") {
        setState({
          tier: "free",
          isTrialActive: false,
          trialEndsAt: null,
          isLoading: false,
          status: sub.status,
          currentPeriodEnd: periodEnd,
          isExpired: true,
          isPendingPayment: false,
          isAdmin: false,
        });
        return;
      }
    }

    // No subscription record — free user, no trial
    setState({
      tier: "free",
      isTrialActive: false,
      trialEndsAt: null,
      isLoading: false,
      status: null,
      currentPeriodEnd: null,
      isExpired: false,
      isPendingPayment: false,
      isAdmin: false,
    });
  }, [user, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
