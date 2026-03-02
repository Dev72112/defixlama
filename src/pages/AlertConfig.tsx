import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Shield, TrendingDown, Vote, AlertTriangle, DollarSign, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type AlertType = "tvl_drop" | "risk_score" | "governance" | "hack" | "price";

interface AlertRule {
  id: string;
  type: AlertType;
  symbol: string;
  condition: string;
  threshold: number;
  enabled: boolean;
}

const ALERT_TYPES: { type: AlertType; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { type: "tvl_drop", label: "TVL Drop", icon: TrendingDown, description: "Alert when protocol TVL drops by percentage" },
  { type: "risk_score", label: "Risk Score Increase", icon: Shield, description: "Alert when risk score rises above threshold" },
  { type: "governance", label: "Governance Vote", icon: Vote, description: "Alert on new governance proposals" },
  { type: "hack", label: "Hack Detected", icon: AlertTriangle, description: "Alert on protocol security incidents" },
  { type: "price", label: "Price Movement", icon: DollarSign, description: "Alert on significant price changes" },
];

export default function AlertConfig() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertRule[]>([
    { id: "1", type: "tvl_drop", symbol: "AAVE", condition: "drops_below", threshold: 10, enabled: true },
    { id: "2", type: "price", symbol: "ETH", condition: "drops_below", threshold: 5, enabled: true },
    { id: "3", type: "hack", symbol: "ALL", condition: "any", threshold: 0, enabled: false },
  ]);
  const [newType, setNewType] = useState<AlertType>("tvl_drop");
  const [newSymbol, setNewSymbol] = useState("");
  const [newThreshold, setNewThreshold] = useState("");

  const addAlert = () => {
    if (!newSymbol) return;
    const alert: AlertRule = {
      id: Date.now().toString(),
      type: newType,
      symbol: newSymbol.toUpperCase(),
      condition: "drops_below",
      threshold: parseFloat(newThreshold) || 5,
      enabled: true,
    };
    setAlerts((prev) => [...prev, alert]);
    setNewSymbol("");
    setNewThreshold("");
    toast({ title: "Alert Created", description: `${ALERT_TYPES.find((a) => a.type === newType)?.label} alert for ${alert.symbol}` });
  };

  const toggleAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Alert Removed" });
  };

  return (
    <TierGate requiredTier="pro">
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Alert Configuration</h1>
                <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
              </div>
              <p className="text-muted-foreground mt-1">Configure multi-type alerts for DeFi protocols</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="h-4 w-4 text-primary" />
              {alerts.filter((a) => a.enabled).length} active
            </div>
          </div>

          {/* Alert Types Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {ALERT_TYPES.map((at) => {
              const Icon = at.icon;
              const count = alerts.filter((a) => a.type === at.type && a.enabled).length;
              return (
                <Card key={at.type} className="p-4 text-center">
                  <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium text-foreground">{at.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{count} active</p>
                </Card>
              );
            })}
          </div>

          {/* Add New Alert */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Create New Alert</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={newType} onValueChange={(v) => setNewType(v as AlertType)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_TYPES.map((at) => (
                    <SelectItem key={at.type} value={at.type}>{at.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Symbol (e.g. AAVE, ETH)" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} className="flex-1" />
              <Input placeholder="Threshold %" type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} className="w-32" />
              <Button onClick={addAlert} className="gap-2">
                <Plus className="h-4 w-4" /> Add Alert
              </Button>
            </div>
          </Card>

          {/* Active Alerts */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Your Alerts ({alerts.length})</h3>
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No alerts configured. Create one above.</p>
              ) : (
                alerts.map((alert) => {
                  const alertType = ALERT_TYPES.find((at) => at.type === alert.type);
                  const Icon = alertType?.icon || Bell;
                  return (
                    <div key={alert.id} className={cn("flex items-center justify-between p-3 rounded-lg border border-border", alert.enabled ? "bg-card" : "bg-muted/30 opacity-60")}>
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{alertType?.label} — {alert.symbol}</p>
                          <p className="text-xs text-muted-foreground">Threshold: {alert.threshold}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleAlert(alert.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                          {alert.enabled ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6" />}
                        </button>
                        <button onClick={() => removeAlert(alert.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </Layout>
    </TierGate>
  );
}
