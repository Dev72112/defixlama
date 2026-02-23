import { useState } from 'react';
import { useAlerts, AlertType } from '@/hooks/useAlerts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, ShieldAlert, Mail, Webhook as WebhookIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface AlertManagerProps {
  protocolSlug?: string;
  protocolName?: string;
}

export function AlertManager({ protocolSlug, protocolName }: AlertManagerProps) {
  const { alerts, createAlert, updateAlert, deleteAlert, isCreating, isDeleting } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<AlertType>('tvl_drop');
  const [threshold, setThreshold] = useState('10');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const handleCreateAlert = () => {
    if (!protocolSlug) {
      alert('Please select a protocol');
      return;
    }

    createAlert({
      protocol_slug: protocolSlug,
      alert_type: selectedType,
      threshold: parseFloat(threshold) || undefined,
      threshold_type: selectedType === 'tvl_drop' ? 'percentage' : 'absolute',
      email_enabled: emailEnabled,
      webhook_url: webhookEnabled ? webhookUrl : undefined,
      webhook_enabled: webhookEnabled && !!webhookUrl,
    });

    // Reset form
    setSelectedType('tvl_drop');
    setThreshold('10');
    setWebhookUrl('');
    setWebhookEnabled(false);
    setIsOpen(false);
  };

  const filteredAlerts = protocolSlug
    ? alerts.filter((a) => a.protocol_slug === protocolSlug)
    : alerts;

  const alertTypeLabels: Record<AlertType, string> = {
    tvl_drop: 'TVL Drop',
    risk_increase: 'Risk Score Increase',
    governance_vote: 'Governance Vote',
    hack_detected: 'Hack Detected',
    price_move: 'Price Movement',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            {protocolName ? `${protocolName} Alerts` : 'Protocol Alerts'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        {!isOpen && (
          <Button onClick={() => setIsOpen(true)} size="sm">
            + New Alert
          </Button>
        )}
      </div>

      {isOpen && (
        <Card className="p-4 border-primary/30 bg-primary/5">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Alert Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(Object.entries(alertTypeLabels) as [AlertType, string][]).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      'p-2 rounded-md border text-sm font-medium transition',
                      selectedType === type
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:bg-muted'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="threshold" className="text-sm font-medium">
                Threshold {selectedType === 'tvl_drop' ? '(%)' : ''}
              </Label>
              <Input
                id="threshold"
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="e.g., 10"
                className="mt-1"
              />
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="email"
                  checked={emailEnabled}
                  onCheckedChange={(checked) => setEmailEnabled(!!checked)}
                />
                <Label htmlFor="email" className="flex items-center gap-1 text-sm font-medium cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email Notification
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="webhook"
                  checked={webhookEnabled}
                  onCheckedChange={(checked) => setWebhookEnabled(!!checked)}
                />
                <Label htmlFor="webhook" className="flex items-center gap-1 text-sm font-medium cursor-pointer">
                  <WebhookIcon className="h-4 w-4" />
                  Webhook Notification
                </Label>
              </div>

              {webhookEnabled && (
                <Input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-webhook-url.com/alert"
                  className="mt-2"
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateAlert} disabled={isCreating} className="flex-1">
                {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Alert
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {filteredAlerts.length > 0 ? (
        <div className="space-y-2">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="p-4 border-border hover:bg-card/80 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={alert.enabled ? 'default' : 'secondary'}>
                      {alert.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">
                      {alertTypeLabels[alert.alert_type as AlertType]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {alert.threshold && (
                      <div className="text-muted-foreground">
                        Threshold: <span className="font-mono font-semibold">{alert.threshold}{alert.threshold_type === 'percentage' ? '%' : ''}</span>
                      </div>
                    )}
                    {alert.email_enabled && (
                      <Badge variant="outline" className="gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </Badge>
                    )}
                    {alert.webhook_enabled && (
                      <Badge variant="outline" className="gap-1">
                        <WebhookIcon className="h-3 w-3" />
                        Webhook
                      </Badge>
                    )}
                  </div>
                </div>
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
            </Card>
          ))}
        </div>
      ) : !isOpen ? (
        <Card className="p-8 text-center border-dashed">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground text-sm">
            {protocolSlug ? 'No alerts yet' : 'Create your first alert'}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
