import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { User, Mail, Globe, Crown, CreditCard, Key, Loader2, Save } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { tier, isTrialActive, trialEndsAt, status, currentPeriodEnd, isAdmin } = useSubscription();

  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, country")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name || "");
        setCountry(data.country || "");
      }
      setLoadingProfile(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, country: country || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/profile`,
    });
    if (error) {
      toast.error("Failed to send reset email");
    } else {
      toast.success("Password reset email sent — check your inbox");
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-muted-foreground">Sign in to view your profile.</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
      </Layout>
    );
  }

  const tierLabel = isAdmin ? "Admin" : isTrialActive ? "Trial (Pro)" : tier === "pro_plus" ? "Pro+" : tier === "pro" ? "Pro" : "Free";

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account settings</p>
        </div>

        {/* Account Info */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <User className="h-5 w-5" /> Account
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. South Africa, United States"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Subscription */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Crown className="h-5 w-5" /> Subscription
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current Plan:</span>
              <Badge variant={tier === "free" ? "secondary" : "default"} className="gap-1">
                <Crown className="h-3 w-3" />
                {tierLabel}
              </Badge>
            </div>
            {status && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="outline" className="capitalize">{status}</Badge>
              </div>
            )}
            {isTrialActive && trialEndsAt && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Trial ends: {format(trialEndsAt, "MMM d, yyyy")} ({Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000))} days left)
                </p>
                <p className="text-xs text-muted-foreground">Trial includes Pro features only. Pro+ features require an upgrade.</p>
              </div>
            )}
            {currentPeriodEnd && !isTrialActive && (
              <p className="text-sm text-muted-foreground">
                Next billing: {format(currentPeriodEnd, "MMM d, yyyy")}
              </p>
            )}
          </div>

          {/* Your Features */}
          <Separator />
          <div>
            <h3 className="text-sm font-medium mb-2">Your Accessible Features</h3>
            <div className="grid grid-cols-1 gap-1.5">
              {(tier === "free" && !isAdmin) ? (
                <p className="text-xs text-muted-foreground">Upgrade to unlock premium analytics pages.</p>
              ) : (
                <>
                  {(isAdmin || tier === "pro" || tier === "pro_plus" || tier === "enterprise") && (
                    <>
                      <FeatureLink label="Backtester" href="/backtester" />
                      <FeatureLink label="Risk Dashboard" href="/risk-dashboard" />
                      <FeatureLink label="Predictions" href="/predictions" />
                      <FeatureLink label="Governance" href="/governance" />
                      <FeatureLink label="Alert Config" href="/alert-config" />
                      <FeatureLink label="Protocol Comparison" href="/protocol-comparison" />
                    </>
                  )}
                  {(isAdmin || tier === "pro_plus" || tier === "enterprise") && (
                    <>
                      <FeatureLink label="Whale Activity" href="/whale-activity" />
                      <FeatureLink label="Market Structure" href="/market-structure" />
                      <FeatureLink label="Yield Intelligence" href="/yield-intelligence" />
                      <FeatureLink label="Correlations" href="/correlations" />
                      <FeatureLink label="Community Sentiment" href="/community-sentiment" />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <Button variant="outline" onClick={() => navigate("/billing")} className="gap-2">
            <CreditCard className="h-4 w-4" />
            Manage Billing
          </Button>
        </Card>

        {/* Security */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Key className="h-5 w-5" /> Security
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Send a password reset link to your email address.
            </p>
            <Button variant="outline" onClick={handlePasswordReset}>
              Reset Password
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
