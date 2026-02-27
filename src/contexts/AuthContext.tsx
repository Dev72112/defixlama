import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionTier } from "@/lib/subscriptionHelper";

export interface AuthUser {
  id: string;
  email?: string;
  subscription_tier: SubscriptionTier;
  subscription_status?: "active" | "paused" | "expired" | "cancelled";
  subscription_expires_at?: string;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
  subscription_tier: SubscriptionTier;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  // Testing helpers
  setTestUser: (tier?: SubscriptionTier) => void;
  clearTestUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check for test user in localStorage first (for development)
    const testUserStr = localStorage.getItem("defixlama_test_user");
    if (testUserStr) {
      try {
        const testUser = JSON.parse(testUserStr);
        setUser(testUser);
        setIsLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse test user:", e);
      }
    }

    // Set up listener for Supabase auth changes
    const initializeAuth = async () => {
      try {
        // Check if user is already logged in
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // User is logged in, fetch their profile
          const { data: profile, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profileError && profileError.code !== "PGRST116") {
            // PGRST116 = no rows returned, which is fine for new users
            console.error("Profile fetch error:", profileError);
            setError(profileError);
          }

          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email,
            subscription_tier: (profile?.subscription_tier as SubscriptionTier) || "free",
            subscription_status: profile?.subscription_status,
            subscription_expires_at: profile?.subscription_expires_at,
            created_at: profile?.created_at,
          };

          setUser(authUser);
        } else {
          // No session, default to free tier
          setUser(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch updated profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          subscription_tier: (profile?.subscription_tier as SubscriptionTier) || "free",
          subscription_status: profile?.subscription_status,
          subscription_expires_at: profile?.subscription_expires_at,
          created_at: profile?.created_at,
        };

        setUser(authUser);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      localStorage.removeItem("defixlama_test_user");
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Testing helpers
  const setTestUser = (tier: SubscriptionTier = "pro") => {
    const testUser: AuthUser = {
      id: "test-user-" + Math.random().toString(36).substring(7),
      email: "test@example.com",
      subscription_tier: tier,
      subscription_status: "active",
      created_at: new Date().toISOString(),
    };
    localStorage.setItem("defixlama_test_user", JSON.stringify(testUser));
    setUser(testUser);
  };

  const clearTestUser = () => {
    localStorage.removeItem("defixlama_test_user");
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    subscription_tier: user?.subscription_tier || "free",
    isAuthenticated: !!user,
    logout,
    setTestUser,
    clearTestUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
