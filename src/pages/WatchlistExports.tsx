import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useExportWatchlist, downloadFile, calculatePortfolioMetrics } from '@/hooks/useWatchlistExport';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Plus, X, Database, FileJson, Code, Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const AVAILABLE_PROTOCOLS = [
  { slug: 'aave', name: 'Aave', default_weight: 20 },
  { slug: 'curve', name: 'Curve Finance', default_weight: 15 },
  { slug: 'lido', name: 'Lido', default_weight: 25 },
  { slug: 'yearn', name: 'Yearn Finance', default_weight: 20 },
  { slug: 'balancer', name: 'Balancer', default_weight: 10 },
  { slug: 'compound', name: 'Compound', default_weight: 10 },
];

export default function WatchlistExports() {
  const [watchlist, setWatchlist] = useState<Array<{ slug: string; name: string; weight: number }>>(
    AVAILABLE_PROTOCOLS.slice(0, 3).map((p) => ({
      slug: p.slug,
      name: p.name,
      weight: p.default_weight,
    }))
  );

  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'api'>('csv');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportMutation = useExportWatchlist();

  const totalWeight = useMemo(() => {
    return watchlist.reduce((sum, p) => sum + p.weight, 0);
  }, [watchlist]);

  const weightPercentages = useMemo(() => {
    return watchlist.map((p) => ({
      ...p,
      percentage: totalWeight > 0 ? ((p.weight / totalWeight) * 100).toFixed(1) : '0',
    }));
  }, [watchlist, totalWeight]);

  const handleAddProtocol = (protocol: (typeof AVAILABLE_PROTOCOLS)[0]) => {
    if (!watchlist.find((p) => p.slug === protocol.slug)) {
      setWatchlist([
        ...watchlist,
        {
          slug: protocol.slug,
          name: protocol.name,
          weight: protocol.default_weight,
        },
      ]);
    }
  };

  const handleRemoveProtocol = (slug: string) => {
    setWatchlist(watchlist.filter((p) => p.slug !== slug));
  };

  const handleWeightChange = (slug: string, weight: number) => {
    setWatchlist(
      watchlist.map((p) =>
        p.slug === slug ? { ...p, weight: Math.max(0, Math.min(100, weight)) } : p
      )
    );
  };

  const handleExport = async () => {
    const result = await exportMutation.mutateAsync({
      protocols: watchlist,
      format: exportFormat,
    });

    if (result) {
      downloadFile(result.format, result.data, result.filename);
      setShowPreview(false);
    }
  };

  const handleCopy = async () => {
    const result = await exportMutation.mutateAsync({
      protocols: watchlist,
      format: exportFormat,
    });
    if (result) {
      await navigator.clipboard.writeText(result.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportedData = useMemo(() => {
    if (!exportMutation.data) return '';
    return exportMutation.data.data;
  }, [exportMutation.data]);

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Download className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-gradient-primary">Watchlist Exports</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Export custom protocol portfolios in CSV, JSON, or API format
            </p>
          </div>
        </div>

        {/* Format Selector */}
        <Card className="p-4 border-border">
          <p className="text-sm text-muted-foreground mb-3 font-semibold">Export Format</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['csv', 'json', 'api'] as const).map((format) => (
              <button
                key={format}
                onClick={() => setExportFormat(format)}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left',
                  exportFormat === format
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:border-primary/50'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {format === 'csv' ? (
                    <Database className="h-5 w-5 text-primary" />
                  ) : format === 'json' ? (
                    <FileJson className="h-5 w-5 text-primary" />
                  ) : (
                    <Code className="h-5 w-5 text-primary" />
                  )}
                  <span className="font-semibold text-foreground uppercase">{format}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format === 'csv'
                    ? 'Spreadsheet format for Excel/Google Sheets'
                    : format === 'json'
                      ? 'Machine-readable JSON structure'
                      : 'API documentation & examples'}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Current Watchlist */}
        <Card className="p-4 border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Watchlist</h2>

          <div className="space-y-3 mb-4">
            {watchlist.length > 0 ? (
              watchlist.map((protocol) => {
                const percentage = totalWeight > 0 ? ((protocol.weight / totalWeight) * 100).toFixed(1) : '0';
                return (
                  <div key={protocol.slug} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{protocol.name}</p>
                      <p className="text-xs text-muted-foreground">Weight: {percentage}%</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={protocol.weight}
                        onChange={(e) => handleWeightChange(protocol.slug, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 border border-border rounded text-sm font-mono bg-background text-foreground"
                      />
                      <span className="text-xs text-muted-foreground w-8">pts</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveProtocol(protocol.slug)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-sm py-4">No protocols selected</p>
            )}
          </div>

          {/* Add Protocol Dropdown */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold">Add More Protocols</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AVAILABLE_PROTOCOLS.map((protocol) => {
                const isInWatchlist = watchlist.find((p) => p.slug === protocol.slug);
                return (
                  <button
                    key={protocol.slug}
                    onClick={() => handleAddProtocol(protocol)}
                    disabled={!!isInWatchlist}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1',
                      isInWatchlist
                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    {isInWatchlist ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Added
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        Add
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Preview & Export */}
        {watchlist.length > 0 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              <Button onClick={handleExport} className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </Button>
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Preview */}
            {showPreview && exportedData && (
              <Card className="p-4 border-border bg-muted/30">
                <p className="text-xs text-muted-foreground font-semibold mb-3">Preview</p>
                <pre className="text-xs text-foreground font-mono overflow-auto max-h-96 p-3 bg-background rounded border border-border whitespace-pre-wrap break-all">
                  {exportedData}
                </pre>
              </Card>
            )}
          </div>
        )}

        {/* Weight Distribution */}
        {watchlist.length > 0 && (
          <Card className="p-4 border-border">
            <h3 className="font-semibold text-foreground mb-3">Weight Distribution</h3>
            <div className="space-y-2">
              {weightPercentages.map((protocol) => (
                <div key={protocol.slug}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground">{protocol.name}</span>
                    <span className="text-muted-foreground">{protocol.percentage}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full"
                      style={{ width: `${parseFloat(protocol.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Format Details */}
        <Card className="p-4 border-border bg-card/50">
          <p className="text-sm font-semibold text-foreground mb-2">About Export Formats</p>
          <div className="text-xs text-muted-foreground space-y-2">
            {exportFormat === 'csv' && (
              <>
                <p>
                  <strong>CSV Format:</strong> Compatible with Excel, Google Sheets, and most data analysis tools.
                  Includes protocol names, slugs, weights, and calculated percentages.
                </p>
                <p>Use this format to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Create rebalancing schedules in spreadsheets</li>
                  <li>Share watchlists with team members</li>
                  <li>Import into portfolio tracking tools</li>
                </ul>
              </>
            )}
            {exportFormat === 'json' && (
              <>
                <p>
                  <strong>JSON Format:</strong> Machine-readable format perfect for developers and integrations.
                  Includes metadata like export timestamp and calculated total weights.
                </p>
                <p>Use this format to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Store watchlists in applications</li>
                  <li>Process data programmatically</li>
                  <li>Integrate with APIs and tools</li>
                </ul>
              </>
            )}
            {exportFormat === 'api' && (
              <>
                <p>
                  <strong>API Format:</strong> Complete documentation for integrating your watchlist with defiXlama API.
                  Shows authentication, endpoints, and example requests/responses.
                </p>
                <p>Use this format to:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Query real-time portfolio metrics (TVL, APY, risk)</li>
                  <li>Build custom dashboards</li>
                  <li>Automate portfolio monitoring</li>
                </ul>
              </>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
