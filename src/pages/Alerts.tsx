import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, Trash2, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { PriceAlertDialog } from "@/components/PriceAlertDialog";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export default function Alerts() {
  const { alerts, activeAlerts, triggeredAlerts, removeAlert, requestNotificationPermission } = usePriceAlerts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(Notification.permission === "granted");
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Price Alerts</h1>
            <p className="text-muted-foreground">
              Get notified when tokens hit your target prices
            </p>
          </div>
          <div className="flex gap-2">
            {!notificationsEnabled && (
              <Button variant="outline" onClick={handleEnableNotifications}>
                <Bell className="mr-2 h-4 w-4" />
                Enable Notifications
              </Button>
            )}
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Alert
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Bell className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{activeAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Triggered</CardTitle>
              <BellOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{triggeredAlerts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No active alerts</p>
                <p className="text-sm">Create your first price alert to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${alert.condition === "above" ? "bg-success/20" : "bg-destructive/20"}`}>
                        {alert.condition === "above" ? (
                          <TrendingUp className="h-4 w-4 text-success" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{alert.symbol}</span>
                          <Badge variant={alert.condition === "above" ? "default" : "secondary"}>
                            {alert.condition} ${alert.targetPrice.toLocaleString()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.name} • Created {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAlert(alert.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Triggered Alerts */}
        {triggeredAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BellOff className="h-5 w-5 text-muted-foreground" />
                Triggered Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {triggeredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/50 opacity-60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        {alert.condition === "above" ? (
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{alert.symbol}</span>
                          <Badge variant="outline">
                            {alert.condition} ${alert.targetPrice.toLocaleString()}
                          </Badge>
                          <Badge variant="secondary" className="bg-success/20 text-success">
                            Triggered
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.name} • {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAlert(alert.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <PriceAlertDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}
