import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useLivePrices } from "@/hooks/useLivePrice";
import { formatCurrency } from "@/lib/api/defillama";
import { useTranslation } from "react-i18next";
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, 
  PieChart, DollarSign, Percent, Activity, Zap
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
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
import { StatCard } from "@/components/dashboard/StatCard";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function Portfolio() {
  const { t } = useTranslation();
  const { 
    holdings, 
    addHolding, 
    removeHolding, 
    totalValue, 
    totalPnl, 
    totalPnlPercent,
    tokenPrices 
  } = usePortfolio();

  // Get live WebSocket prices for held symbols
  const heldSymbols = useMemo(() => holdings.map(h => h.symbol.toUpperCase()), [holdings]);
  const { prices: livePrices, isConnected: wsConnected } = useLivePrices(heldSymbols);

  // Enhance holdings with live prices where available
  const liveHoldings = useMemo(() => holdings.map(h => {
    const livePrice = livePrices[h.symbol.toUpperCase()];
    if (livePrice && livePrice > 0) {
      const value = h.quantity * livePrice;
      const costBasis = h.purchasePrice ? h.quantity * h.purchasePrice : 0;
      const pnl = costBasis > 0 ? value - costBasis : 0;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      return { ...h, currentPrice: livePrice, value, costBasis, pnl, pnlPercent };
    }
    return h;
  }), [holdings, livePrices]);

  const liveTotalValue = liveHoldings.reduce((s, h) => s + h.value, 0);
  const liveTotalCost = liveHoldings.reduce((s, h) => s + h.costBasis, 0);
  const liveTotalPnl = liveTotalCost > 0 ? liveTotalValue - liveTotalCost : 0;
  const liveTotalPnlPct = liveTotalCost > 0 ? (liveTotalPnl / liveTotalCost) * 100 : 0;
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  const handleAdd = () => {
    const token = tokenPrices.find(t => t.symbol === selectedToken);
    if (!token || !quantity) return;
    
    addHolding({
      tokenId: token.symbol,
      symbol: token.symbol,
      name: token.name,
      quantity: parseFloat(quantity),
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
    });
    
    setIsAddOpen(false);
    setSelectedToken("");
    setQuantity("");
    setPurchasePrice("");
  };

  // Pie chart data
  const pieData = holdings
    .filter(h => h.value > 0)
    .map(h => ({
      name: h.symbol,
      value: h.value,
    }));

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("portfolio.title")}</h1>
            <p className="text-muted-foreground mt-1">{t("portfolio.subtitle")}</p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("portfolio.addHolding")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("portfolio.addTokenHolding")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("common.token")}</label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("portfolio.selectToken")} />
                    </SelectTrigger>
                    <SelectContent>
                      {tokenPrices.map((token) => (
                        <SelectItem key={token.symbol} value={token.symbol}>
                          <div className="flex items-center gap-2">
                            {token.logo && (
                              <img src={token.logo} alt="" className="h-5 w-5 rounded-full" />
                            )}
                            {token.name} ({token.symbol})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("portfolio.quantity")}</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("portfolio.purchasePrice")}</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{t("portfolio.purchasePriceHint")}</p>
                </div>
                <Button onClick={handleAdd} className="w-full" disabled={!selectedToken || !quantity}>
                  {t("portfolio.addToPortfolio")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("portfolio.totalValue")}
            value={formatCurrency(totalValue)}
            icon={Wallet}
          />
          <StatCard
            title={t("portfolio.totalPnl")}
            value={`${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl)}`}
            change={totalPnlPercent}
            icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
          />
          <StatCard
            title={t("portfolio.holdings")}
            value={holdings.length.toString()}
            icon={Activity}
          />
          <StatCard
            title={t("portfolio.pnlPercent")}
            value={`${totalPnlPercent >= 0 ? "+" : ""}${totalPnlPercent.toFixed(2)}%`}
            change={totalPnlPercent}
            icon={Percent}
          />
        </div>

        {/* Portfolio Content */}
        {holdings.length === 0 ? (
          <Card className="p-12 text-center">
            <Wallet className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("portfolio.noHoldings")}</h2>
            <p className="text-muted-foreground mb-4">{t("portfolio.addFirst")}</p>
            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("portfolio.addFirstToken")}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                {t("portfolio.allocation")}
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Holdings Table */}
            <Card className="p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {t("portfolio.holdings")}
              </h3>
              <div className="overflow-hidden">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-3">{t("common.token")}</th>
                      <th className="pb-3 text-right hidden sm:table-cell">{t("portfolio.quantity")}</th>
                      <th className="pb-3 text-right hidden sm:table-cell">{t("common.price")}</th>
                      <th className="pb-3 text-right">{t("portfolio.totalValue")}</th>
                      <th className="pb-3 text-right">{t("portfolio.totalPnl")}</th>
                      <th className="pb-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding) => (
                      <tr key={holding.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {holding.logo && (
                              <img src={holding.logo} alt="" className="h-6 w-6 rounded-full" />
                            )}
                            <div>
                              <p className="font-medium">{holding.symbol}</p>
                              <p className="text-xs text-muted-foreground">{holding.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono hidden sm:table-cell">
                          {holding.quantity.toLocaleString()}
                        </td>
                        <td className="py-3 text-right font-mono hidden sm:table-cell">
                          ${holding.currentPrice.toFixed(holding.currentPrice >= 1 ? 2 : 6)}
                        </td>
                        <td className="py-3 text-right font-mono font-medium">
                          {formatCurrency(holding.value)}
                        </td>
                        <td className="py-3 text-right">
                          {holding.costBasis > 0 ? (
                            <div>
                              <span className={cn(
                                "font-mono",
                                holding.pnl >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {holding.pnl >= 0 ? "+" : ""}{formatCurrency(holding.pnl)}
                              </span>
                              <span className={cn(
                                "block text-xs",
                                holding.pnlPercent >= 0 ? "text-success" : "text-destructive"
                              )}>
                                ({holding.pnlPercent >= 0 ? "+" : ""}{holding.pnlPercent.toFixed(2)}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHolding(holding.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Info */}
        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {t("portfolio.dataInfo")}
          </p>
        </Card>
      </div>
    </Layout>
  );
}
