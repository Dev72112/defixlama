import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export interface WatchlistExport {
  id: string;
  name: string;
  format: 'csv' | 'json' | 'api';
  created_at: string;
  protocols: Array<{
    slug: string;
    name: string;
    weight: number;
  }>;
}

export interface ExportedData {
  format: 'csv' | 'json' | 'api';
  data: string;
  filename: string;
}

export function useWatchlistExports() {
  return useQuery({
    queryKey: ['watchlist-exports'],
    queryFn: async () => {
      // Simulate backend fetch
      await new Promise((resolve) => setTimeout(resolve, 200));
      return [] as WatchlistExport[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useExportWatchlist() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      protocols: Array<{ slug: string; name: string; weight: number }>;
      format: 'csv' | 'json' | 'api';
    }): Promise<ExportedData> => {
      const { protocols, format } = params;

      if (format === 'csv') {
        const headers = ['Protocol', 'Slug', 'Weight', 'Percentage'];
        const totalWeight = protocols.reduce((sum, p) => sum + p.weight, 0);
        const rows = protocols.map((p) => [
          p.name,
          p.slug,
          p.weight,
          totalWeight > 0 ? ((p.weight / totalWeight) * 100).toFixed(2) : '0',
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

        return {
          format: 'csv',
          data: csv,
          filename: `watchlist-${new Date().toISOString().split('T')[0]}.csv`,
        };
      } else if (format === 'json') {
        const json = {
          exported_at: new Date().toISOString(),
          protocol_count: protocols.length,
          protocols: protocols,
          total_weight: protocols.reduce((sum, p) => sum + p.weight, 0),
        };

        return {
          format: 'json',
          data: JSON.stringify(json, null, 2),
          filename: `watchlist-${new Date().toISOString().split('T')[0]}.json`,
        };
      } else {
        // API format - returns endpoint documentation
        const apiDocs = `# Watchlist API Format

## Authentication
Add header: Authorization: Bearer YOUR_API_KEY

## Endpoint
POST /api/v1/watchlist/evaluate

## Request Body
${JSON.stringify(
  {
    protocols: protocols.map((p) => ({
      slug: p.slug,
      weight: p.weight,
    })),
    metrics: ['tvl', 'apy', 'risk_score', 'market_cap'],
  },
  null,
  2
)}

## Response
${JSON.stringify(
  {
    timestamp: new Date().toISOString(),
    portfolio_metrics: {
      weighted_tvl: 15000000000,
      weighted_apy: 8.5,
      weighted_risk: 22,
      expected_annual_yield: 1275000000,
    },
    individual_protocols: protocols.map((p) => ({
      slug: p.slug,
      weight: p.weight,
      tvl: Math.floor(Math.random() * 10000000000),
      apy: (Math.random() * 20).toFixed(2),
    })),
  },
  null,
  2
)}
`;
        return {
          format: 'api',
          data: apiDocs,
          filename: `watchlist-api-docs-${new Date().toISOString().split('T')[0]}.md`,
        };
      }
    },
    onSuccess: () => {
      toast({
        title: 'Export generated',
        description: 'Your watchlist has been exported successfully',
      });
    },
  });
}

export function downloadFile(format: string, data: string, filename: string) {
  const element = document.createElement('a');
  const file = new Blob([data], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function calculatePortfolioMetrics(
  protocols: Array<{ slug: string; weight: number; tvl?: number; apy?: number }>
) {
  const totalWeight = protocols.reduce((sum, p) => sum + p.weight, 0);

  const weightedApy = protocols.reduce((sum, p) => sum + ((p.apy || 0) * p.weight) / totalWeight, 0);
  const weightedTvl = protocols.reduce((sum, p) => sum + ((p.tvl || 0) * p.weight) / totalWeight, 0);

  return {
    weighted_apy: weightedApy,
    weighted_tvl: weightedTvl,
    portfolio_diversity: protocols.length,
  };
}
