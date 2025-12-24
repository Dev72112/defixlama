import { useState, useEffect } from "react";
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
import { useTokenPrices } from "@/hooks/useTokenData";

interface PriceAlertDialogProps {
  tokenId?: string;
  symbol?: string;
  name?: string;
  currentPrice?: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PriceAlertDialog({ 
  tokenId: initialTokenId, 
  symbol: initialSymbol, 
  name: initialName, 
  currentPrice: initialPrice,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: PriceAlertDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [selectedToken, setSelectedToken] = useState("");
  
  const { addAlert, requestNotificationPermission } = usePriceAlerts();
  const { data: tokenPrices = [] } = useTokenPrices();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  // Use provided token or selected token from dropdown
  const token = initialSymbol 
    ? { id: initialTokenId, symbol: initialSymbol, name: initialName, price: initialPrice }
    : tokenPrices.find(t => t.symbol === selectedToken);

  useEffect(() => {
    if (isOpen && tokenPrices.length > 0 && !initialSymbol && !selectedToken) {
      setSelectedToken(tokenPrices[0]?.symbol || "");
    }
  }, [isOpen, tokenPrices, initialSymbol, selectedToken]);

  const handleCreate = async () => {
    if (!targetPrice || !token) return;
    
    await requestNotificationPermission();
    
    addAlert({
      tokenId: token.id || selectedToken,
      symbol: token.symbol!,
      name: token.name!,
      targetPrice: parseFloat(targetPrice),
      condition,
    });
    
    setIsOpen(false);
    setTargetPrice("");
    setSelectedToken("");
  };

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          {initialSymbol ? `Price Alert for ${initialSymbol}` : "Create Price Alert"}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-4">
        {/* Token selector for standalone mode */}
        {!initialSymbol && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Token</label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a token" />
              </SelectTrigger>
              <SelectContent>
                {tokenPrices.map((t) => (
                  <SelectItem key={t.symbol} value={t.symbol}>
                    {t.symbol} - {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {token && (
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="text-xl font-bold">
              ${(token.price ?? 0).toFixed((token.price ?? 0) >= 1 ? 2 : 6)}
            </p>
          </div>
        )}
        
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
          You'll receive a browser notification when {token?.symbol || "the token"} goes {condition} ${targetPrice || "your target"}.
        </p>
        
        <Button onClick={handleCreate} className="w-full" disabled={!targetPrice || !token}>
          Create Alert
        </Button>
      </div>
    </DialogContent>
  );

  // Controlled mode (for Alerts page)
  if (isControlled) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  // Uncontrolled mode with trigger
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
      {dialogContent}
    </Dialog>
  );
}
