import { Layout } from "@/components/layout/Layout";
import { TierGate } from "@/components/TierGate";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Download, FileJson, FileSpreadsheet, Trash2, Star, Clock, Calendar, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveDataTable, ResponsiveColumn } from "@/components/ui/responsive-table";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface WatchlistItem {
  id: string; symbol: string; name: string; type: string;
}

interface ExportHistoryEntry {
  id: string; format: string; items: number; date: string;
}

export default function WatchlistExports() {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "quick";

  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>([]);

  const exportCSV = () => {
    if (!watchlist.length) { toast({ title: "No items", description: "Add items to your watchlist first" }); return; }
    const headers = "ID,Symbol,Name,Type\n";
    const rows = watchlist.map((w) => `${w.id},${w.symbol},${w.name},${w.type}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `watchlist-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    setExportHistory(prev => [{ id: Date.now().toString(), format: "CSV", items: watchlist.length, date: new Date().toLocaleString() }, ...prev]);
    toast({ title: "Exported", description: `${watchlist.length} items exported as CSV` });
  };

  const exportJSON = () => {
    if (!watchlist.length) { toast({ title: "No items", description: "Add items to your watchlist first" }); return; }
    const blob = new Blob([JSON.stringify(watchlist, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `watchlist-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
    setExportHistory(prev => [{ id: Date.now().toString(), format: "JSON", items: watchlist.length, date: new Date().toLocaleString() }, ...prev]);
    toast({ title: "Exported", description: `${watchlist.length} items exported as JSON` });
  };

  const columns: ResponsiveColumn<WatchlistItem>[] = [
    { key: "symbol", label: "Symbol", priority: "always", render: (item) => <span className="font-mono font-medium text-foreground">{item.symbol}</span> },
    { key: "name", label: "Name", priority: "always", render: (item) => <span className="text-foreground">{item.name}</span> },
    { key: "type", label: "Type", priority: "always", align: "center", render: (item) => <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge> },
    { key: "actions", label: "Actions", priority: "always", align: "center", render: (item) => (
      <button onClick={(e) => { e.stopPropagation(); removeFromWatchlist(item.id, item.type as "token" | "protocol" | "dex"); }} className="text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="h-4 w-4" />
      </button>
    ) },
  ];

  const historyColumns: ResponsiveColumn<ExportHistoryEntry>[] = [
    { key: "format", label: "Format", priority: "always", render: (e) => <Badge variant="outline" className="text-xs">{e.format}</Badge> },
    { key: "items", label: "Items", priority: "always", align: "right", render: (e) => <span className="font-mono text-foreground">{e.items}</span> },
    { key: "date", label: "Date", priority: "always", align: "right", render: (e) => <span className="text-sm text-muted-foreground">{e.date}</span> },
  ];

  return (
    <Layout>
      <TierGate requiredTier="pro_plus">
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Watchlist Exports</h1>
                <Badge className="bg-primary/20 text-primary text-xs">PRO+</Badge>
              </div>
              <p className="text-muted-foreground mt-1">Export your watchlist as CSV or JSON for external tools</p>
            </div>
          </div>

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

          <Tabs value={currentTab} onValueChange={(v) => setSearchParams({ tab: v })} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="quick" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Quick Export</TabsTrigger>
              <TabsTrigger value="scheduled" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Scheduled</TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> History</TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportJSON} className="gap-2">
                  <FileJson className="h-4 w-4" /> Export JSON
                </Button>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Your Watchlist</h3>
                <ResponsiveDataTable columns={columns} data={watchlist as WatchlistItem[]} keyField="id" emptyMessage="Your watchlist is empty. Add tokens, protocols, or DEXes from their detail pages." emptyIcon={<Star className="h-12 w-12 text-muted-foreground" />} />
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Scheduled Exports</h3>
                <p className="text-sm text-muted-foreground mb-4">Automatically export your watchlist at set intervals</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto">
                  {["Daily", "Weekly", "Monthly"].map((interval) => (
                    <Button key={interval} variant="outline" className="gap-2" onClick={() => toast({ title: `${interval} Export Scheduled`, description: "You'll receive exports automatically" })}>
                      <CheckCircle className="h-3.5 w-3.5" /> {interval}
                    </Button>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Export History</h3>
                <ResponsiveDataTable columns={historyColumns} data={exportHistory} keyField="id" emptyMessage="No exports yet" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </TierGate>
  );
}
