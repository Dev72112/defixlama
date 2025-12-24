import { usePriceAlerts, PriceAlert } from "@/hooks/usePriceAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellOff, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { formatTokenPrice } from "@/lib/utils";
import { Link } from "react-router-dom";

export function PriceAlertsPanel() {
  const { activeAlerts, triggeredAlerts, removeAlert } = usePriceAlerts();

  const AlertItem = ({ alert, isTriggered = false }: { alert: PriceAlert; isTriggered?: boolean }) => (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg border ${
        isTriggered 
          ? "bg-success/10 border-success/30" 
          : "bg-card border-border hover:border-primary/30"
      } transition-colors`}
    >
      <div className="flex items-center gap-3">
        {alert.condition === "above" ? (
          <TrendingUp className={`h-4 w-4 ${isTriggered ? "text-success" : "text-primary"}`} />
        ) : (
          <TrendingDown className={`h-4 w-4 ${isTriggered ? "text-success" : "text-destructive"}`} />
        )}
        <div>
          <Link 
            to={`/tokens/${alert.tokenId}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {alert.symbol}
          </Link>
          <p className="text-xs text-muted-foreground">
            {alert.condition === "above" ? "Above" : "Below"} {formatTokenPrice(alert.targetPrice)}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => removeAlert(alert.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  if (activeAlerts.length === 0 && triggeredAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-primary" />
            Price Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BellOff className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">No price alerts set</p>
            <p className="text-xs text-muted-foreground mt-1">
              Visit a token page to set alerts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5 text-primary" />
          Price Alerts
          {activeAlerts.length > 0 && (
            <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary">
              {activeAlerts.length} active
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</h4>
            {activeAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        )}
        
        {triggeredAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Triggered</h4>
            {triggeredAlerts.slice(0, 5).map((alert) => (
              <AlertItem key={alert.id} alert={alert} isTriggered />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
