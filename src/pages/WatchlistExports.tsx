import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Download, FileJson, FileSpreadsheet, Trash2, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function WatchlistExports() {
  const { watchlist, removeFromWatchlist } = useWatchlist();

  const exportCSV = () => {
    if (!watchlist.length) {
      toast({ title: "No items", description: "Add items to your watchlist first" });
      return;
    }
    const headers = "ID,Symbol,Name,Type\n";
    const rows = watchlist.map((w) => `${w.id},${w.symbol},${w.name},${w.type}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${watchlist.length} items exported as CSV` });
  };

  const exportJSON = () => {
    if (!watchlist.length) {
      toast({ title: "No items", description: "Add items to your watchlist first" });
      return;
    }
    const blob = new Blob([JSON.stringify(watchlist, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watchlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${watchlist.length} items exported as JSON` });
  };

  return (
    <TierGate requiredTier="pro">
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Watchlist Exports</h1>
                <Badge className="bg-primary/20 text-primary text-xs">PRO</Badge>
              </div>
              <p className="text-muted-foreground mt-1">Export your watchlist as CSV or JSON for external tools</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportJSON} className="gap-2">
                <FileJson className="h-4 w-4" /> Export JSON
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <Star className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{watchlist.length}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{watchlist.filter((w) => w.type === "token").length}</p>
              <p className="text-xs text-muted-foreground">Tokens</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{watchlist.filter((w) => w.type === "protocol").length}</p>
              <p className="text-xs text-muted-foreground">Protocols</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{watchlist.filter((w) => w.type === "dex").length}</p>
              <p className="text-xs text-muted-foreground">DEXes</p>
            </Card>
          </div>

          {/* Watchlist Table */}
          <Card className="p-4">
            <h3 className="font-semibold text-foreground mb-3">Your Watchlist</h3>
            {watchlist.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Your watchlist is empty.</p>
                <p className="text-sm text-muted-foreground mt-1">Add tokens, protocols, or DEXes from their detail pages.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left">Symbol</th>
                      <th className="text-left">Name</th>
                      <th className="text-center">Type</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="font-mono font-medium text-foreground">{item.symbol}</td>
                        <td className="text-foreground">{item.name}</td>
                        <td className="text-center">
                          <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => removeFromWatchlist(item.id, item.type)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </Layout>
    </TierGate>
  );
}
