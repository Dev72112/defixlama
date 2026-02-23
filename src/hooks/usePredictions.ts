import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Prediction {
  id: string;
  protocol_slug: string;
  chain: string;
  prediction_date: string;
  predicted_tvl: number | null;
  predicted_apy: number | null;
  confidence_score: number;
  model_type: string;
  created_at: string;
}

// Mock prediction data generator
function generateMockPrediction(protocolSlug: string, daysAhead: number): Prediction {
  const baseTVL: Record<string, number> = {
    aave: 15000000000,
    curve: 8000000000,
    lido: 35000000000,
    yearn: 7000000000,
  };

  const baseAPY: Record<string, number> = {
    aave: 3.5,
    curve: 5.2,
    lido: 2.8,
    yearn: 8.1,
  };

  const tvl = (baseTVL[protocolSlug] ?? 10000000000) * (1 + (Math.random() - 0.5) * 0.1);
  const apy = (baseAPY[protocolSlug] ?? 4.0) * (1 + (Math.random() - 0.5) * 0.2);

  return {
    id: `${protocolSlug}-${daysAhead}`,
    protocol_slug: protocolSlug,
    chain: 'all',
    prediction_date: new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0],
    predicted_tvl: tvl,
    predicted_apy: apy,
    confidence_score: Math.max(60, 95 - daysAhead * 2),
    model_type: 'ensemble',
    created_at: new Date().toISOString(),
  };
}

export function usePredictions(protocolSlug: string) {
  return useQuery({
    queryKey: ['predictions', protocolSlug],
    queryFn: async () => {
      // Generate mock predictions for 30, 60, 90 days ahead
      const predictions = [
        generateMockPrediction(protocolSlug, 30),
        generateMockPrediction(protocolSlug, 60),
        generateMockPrediction(protocolSlug, 90),
      ];

      return predictions as Prediction[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useAllPredictions() {
  return useQuery({
    queryKey: ['all-predictions'],
    queryFn: async () => {
      const protocols = ['aave', 'curve', 'lido', 'yearn', 'balancer'];
      const predictions: Prediction[] = [];

      for (const protocol of protocols) {
        for (const days of [30, 60, 90]) {
          predictions.push(generateMockPrediction(protocol, days));
        }
      }

      return predictions;
    },
    staleTime: 1000 * 60 * 60,
  });
}
