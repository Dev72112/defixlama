import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Shield, TrendingDown, Vote, AlertTriangle, DollarSign, Plus, Trash2, ToggleLeft, ToggleRight, History, Lightbulb, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

type AlertType = "tvl_drop" | "risk_score" | "governance" | "hack" | "price";

interface AlertRule {
  id: string;
  type: AlertType;
  symbol: string;
  condition: string;
  threshold: number;
  enabled: boolean;
}

interface AlertHistoryEntry {
  id: string;
  type: AlertType;
  symbol: string;
  triggeredAt: string;
  message: string;
}

interface SmartSuggestion {
  id: string;
  type: AlertType;
  symbol: string;
  reason: string;
  threshold: number;
  confidence: number;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "active";

  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [newType, setNewType] = useState<AlertType>("tvl_drop");
  const [newSymbol, setNewSymbol] = useState("");
  const [newThreshold, setNewThreshold] = useState("");

  const [alertHistory] = useState<AlertHistoryEntry[]>([]);

  const smartSuggestions = useMemo<SmartSuggestion[]>(() => {
    // Will be empty until we have real protocol data to derive suggestions from
    return [];
  }, []);

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

  const adoptSuggestion = (s: SmartSuggestion) => {
    const alert: AlertRule = { id: Date.now().toString(), type: s.type, symbol: s.symbol, condition: "drops_below", threshold: s.threshold, enabled: true };
    setAlerts((prev) => [...prev, alert]);
    toast({ title: "Alert Created from Suggestion", description: `${ALERT_TYPES.find((a) => a.type === s.type)?.label} for ${s.symbol}` });
    setSearchParams({ tab: "active" });
  };

  const columns: ResponsiveColumn<AlertRule>[] = [
    { key: "type", label: "Type", priority: "always", render: (alert) => {
      const alertType = ALERT_TYPES.find((at) => at.type === alert.type);
      const Icon = alertType?.icon || Bell;
      return (<div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="font-medium text-foreground">{alertType?.label}</span></div>);
    } },
    { key: "symbol", label: "Symbol", priority: "always", render: (alert) => <span className="font-mono text-foreground">{alert.symbol}</span> },
    { key: "threshold", label: "Threshold", priority: "always", align: "right", render: (alert) => <span className="text-muted-foreground">{alert.threshold}%</span> },
    { key: "enabled", label: "Status", priority: "always", align: "center", render: (alert) => (
      <button onClick={(e) => { e.stopPropagation(); toggleAlert(alert.id); }} className="text-muted-foreground hover:text-foreground transition-colors">
        {alert.enabled ? <ToggleRight className="h-6 w-6 text-primary" /> : <ToggleLeft className="h-6 w-6" />}
      </button>
    ) },
    { key: "actions", label: "", priority: "always", align: "center", render: (alert) => (
      <button onClick={(e) => { e.stopPropagation(); removeAlert(alert.id); }} className="text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="h-4 w-4" />
      </button>
    ) },
  ];

  const historyColumns: ResponsiveColumn<AlertHistoryEntry>[] = [
    { key: "type", label: "Type", priority: "always", render: (h) => {
      const at = ALERT_TYPES.find((a) => a.type === h.type);
      const Icon = at?.icon || Bell;
      return <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="text-sm">{at?.label}</span></div>;
    } },
    { key: "symbol", label: "Symbol", priority: "always", render: (h) => <span className="font-mono text-foreground">{h.symbol}</span> },
    { key: "message", label: "Message", priority: "expanded", render: (h) => <span className="text-sm text-muted-foreground">{h.message}</span> },
    { key: "triggeredAt", label: "Triggered", priority: "always", align: "right", render: (h) => <span className="text-xs text-muted-foreground">{h.triggeredAt}</span> },
  ];

  return (
    <Layout>
      <TierGate requiredTier="pro">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

          <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="active" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Active Alerts</TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5"><History className="h-3.5 w-3.5" /> Alert History</TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-1.5"><Lightbulb className="h-3.5 w-3.5" /> Smart Suggestions</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-3">Create New Alert</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={newType} onValueChange={(v) => setNewType(v as AlertType)}>
                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{ALERT_TYPES.map((at) => <SelectItem key={at.type} value={at.type}>{at.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input placeholder="Symbol (e.g. AAVE, ETH)" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} className="flex-1" />
                  <Input placeholder="Threshold %" type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} className="w-full sm:w-32" />
                  <Button onClick={addAlert} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
                </div>
              </Card>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Your Alerts ({alerts.length})</h3>
                <ResponsiveDataTable columns={columns} data={alerts} keyField="id" emptyMessage="No alerts configured. Create one above." />
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Recently Triggered Alerts</h3>
                <ResponsiveDataTable columns={historyColumns} data={alertHistory} keyField="id" emptyMessage="No alerts have been triggered yet." />
              </div>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <p className="text-sm text-muted-foreground">Suggestions based on market conditions will appear here as protocols experience significant changes</p>
              {smartSuggestions.length === 0 ? (
                <Card className="p-8 text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">No Suggestions Yet</h3>
                  <p className="text-sm text-muted-foreground">Smart suggestions will appear when significant market movements are detected</p>
                </Card>
              ) : (
              <div className="space-y-3">
                {smartSuggestions.map((s) => {
                  const at = ALERT_TYPES.find((a) => a.type === s.type);
                  const Icon = at?.icon || Bell;
                  return (
                    <Card key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{at?.label}</span>
                            <span className="font-mono text-sm text-muted-foreground">{s.symbol}</span>
                            <Badge variant="outline" className={cn("text-xs", s.confidence >= 80 ? "border-success text-success" : s.confidence >= 60 ? "border-warning text-warning" : "border-muted-foreground text-muted-foreground")}>{s.confidence}%</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{s.reason}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => adoptSuggestion(s)} className="flex-shrink-0">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Adopt
                      </Button>
                    </Card>
                  );
                })}
              </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </TierGate>
  );
}
