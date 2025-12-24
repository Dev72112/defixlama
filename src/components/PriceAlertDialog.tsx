import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, BellRing } from "lucide-react";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";

interface PriceAlertDialogProps {
  tokenId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  trigger?: React.ReactNode;
}

export function PriceAlertDialog({ 
  tokenId, 
  symbol, 
  name, 
  currentPrice,
  trigger 
}: PriceAlertDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  
  const { addAlert, requestNotificationPermission } = usePriceAlerts();

  const handleCreate = async () => {
    if (!targetPrice) return;
    
    // Request notification permission
    await requestNotificationPermission();
    
    addAlert({
      tokenId,
      symbol,
      name,
      targetPrice: parseFloat(targetPrice),
      condition,
    });
    
    setIsOpen(false);
    setTargetPrice("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Set Alert
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Price Alert for {symbol}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-xl font-bold">
              ${currentPrice.toFixed(currentPrice >= 1 ? 2 : 6)}
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Alert when price goes</label>
            <Select value={condition} onValueChange={(v) => setCondition(v as "above" | "below")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Above</SelectItem>
                <SelectItem value="below">Below</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Price ($)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            You'll receive a browser notification when {symbol} goes {condition} ${targetPrice || "your target"}.
          </p>
          
          <Button onClick={handleCreate} className="w-full" disabled={!targetPrice}>
            Create Alert
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
