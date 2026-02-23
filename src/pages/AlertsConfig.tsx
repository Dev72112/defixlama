import { useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAlerts } from '@/hooks/useAlerts';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertManager } from '@/components/AlertManager';
import { Bell, Search, Trash2, ToggleLeft, Mail, Webhook as WebhookIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AlertsConfig() {
  const { user } = useAuth();
  const { alerts, deleteAlert, updateAlert, isLoading, isDeleting } = useAlerts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Card className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Please sign in to manage alerts</p>
          </Card>
        </div>
      </Layout>
    );
  }

  const filteredAlerts = useMemo(() => {
    return alerts.filter(
      (a) =>
        a.protocol_slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.alert_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [alerts, searchTerm]);

  // Group by protocol
  const groupedByProtocol = useMemo(() => {
    const grouped: Record<string, typeof alerts> = {};
    filteredAlerts.forEach((alert) => {
      if (!grouped[alert.protocol_slug]) {
        grouped[alert.protocol_slug] = [];
      }
      grouped[alert.protocol_slug].push(alert);
    });
    return grouped;
  }, [filteredAlerts]);

  const alertTypeLabels: Record<string, string> = {
    tvl_drop: 'TVL Drop',
    risk_increase: 'Risk Score Increase',
    governance_vote: 'Governance Vote',
    hack_detected: 'Hack Detected',
    price_move: 'Price Movement',
  };

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Alert Configuration</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Set up real-time alerts for protocols you're monitoring
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Alerts</p>
            <p className="text-2xl font-bold text-primary">{alerts.length}</p>
          </Card>
          <Card className="p-4 border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active</p>
            <p className="text-2xl font-bold text-green-500">{alerts.filter((a) => a.enabled).length}</p>
          </Card>
          <Card className="p-4 border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Email Alerts</p>
            <p className="text-2xl font-bold text-blue-500">{alerts.filter((a) => a.email_enabled).length}</p>
          </Card>
          <Card className="p-4 border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Webhooks</p>
            <p className="text-2xl font-bold text-purple-500">{alerts.filter((a) => a.webhook_enabled).length}</p>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : alerts.length === 0 ? (
          <Card className="p-12 border-dashed text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No alerts yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create alerts to get notified about important events on your monitored protocols
            </p>
            <Button size="lg">Create First Alert</Button>
          </Card>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Alerts by Protocol */}
            {Object.entries(groupedByProtocol).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedByProtocol).map(([protocol, protocolAlerts]) => (
                  <Card key={protocol} className="p-4 border-border">
                    <div className="mb-4">
                      <h3 className="font-semibold text-foreground capitalize">{protocol}</h3>
                      <p className="text-sm text-muted-foreground">
                        {protocolAlerts.length} alert{protocolAlerts.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {protocolAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border border-border/50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {alertTypeLabels[alert.alert_type]}
                              </span>
                              <Badge variant={alert.enabled ? 'default' : 'secondary'} className="text-xs">
                                {alert.enabled ? 'On' : 'Off'}
                              </Badge>
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {alert.threshold && (
                                <span>Threshold: {alert.threshold}{alert.threshold_type === 'percentage' ? '%' : ''}</span>
                              )}
                              {alert.email_enabled && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  Email
                                </div>
                              )}
                              {alert.webhook_enabled && (
                                <div className="flex items-center gap-1">
                                  <WebhookIcon className="h-3 w-3" />
                                  Webhook
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              onClick={() => updateAlert({ id: alert.id, enabled: !alert.enabled })}
                              variant="ghost"
                              size="sm"
                              className={cn(
                                'transition',
                                alert.enabled ? 'text-green-500 hover:bg-green-500/10' : 'text-muted-foreground hover:bg-muted'
                              )}
                            >
                              <ToggleLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => deleteAlert(alert.id)}
                              disabled={isDeleting}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No alerts match your search</p>
              </Card>
            )}
          </>
        )}

        {/* Help Section */}
        <Card className="p-4 border-primary/30 bg-primary/5">
          <h3 className="font-semibold text-foreground mb-2">Alert Types Explained</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• <strong>TVL Drop</strong>: Notified when protocol TVL drops by threshold %</li>
            <li>• <strong>Risk Score Increase</strong>: When overall risk score increases</li>
            <li>• <strong>Governance Vote</strong>: New governance votes or proposals</li>
            <li>• <strong>Hack Detected</strong>: Security incidents or exploits</li>
            <li>• <strong>Price Movement</strong>: Token price changes above threshold</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
}
