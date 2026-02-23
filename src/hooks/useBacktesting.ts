import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { BacktestConfig, runBacktest, BacktestResults } from '@/lib/backtesting/engine';

export interface SavedBacktest {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  protocols: { slug: string; weight: number }[];
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_value: number;
  returns_pct: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_days: number;
  total_days: number;
  daily_nav: { date: string; nav: number; returns_pct: number }[];
  created_at: string;
  updated_at: string;
}

interface CreateBacktestInput {
  name: string;
  description?: string;
  config: BacktestConfig;
}

export function useBacktesting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch saved backtests
  const backtestsQuery = useQuery({
    queryKey: ['backtests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase
        .from('backtest_strategies' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as SavedBacktest[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Run backtest
  const runMutation = useMutation({
    mutationFn: async (input: CreateBacktestInput) => {
      const results = runBacktest(input.config);
      return results;
    },
    onSuccess: (results) => {
      toast.success('Backtest completed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Backtest failed');
    },
  });

  // Save backtest
  const saveMutation = useMutation({
    mutationFn: async (input: { name: string; description?: string; results: BacktestResults }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('backtest_strategies' as any)
        .insert([
          {
            user_id: user.id,
            name: input.name,
            description: input.description || null,
            protocols: input.results.config.protocols,
            start_date: input.results.config.startDate.toISOString().split('T')[0],
            end_date: input.results.config.endDate.toISOString().split('T')[0],
            initial_capital: input.results.initialValue,
            final_value: input.results.finalValue,
            returns_pct: input.results.returnsPercent,
            sharpe_ratio: input.results.sharpeRatio,
            max_drawdown: input.results.maxDrawdown,
            win_days: input.results.winDays,
            total_days: input.results.totalDays,
            daily_nav: input.results.daily.map((d) => ({
              date: d.date,
              nav: d.navPerShare,
              returns_pct: d.returnsPercent,
            })),
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return data as SavedBacktest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests', user?.id] });
      toast.success('Backtest saved!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save backtest');
    },
  });

  // Delete backtest
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('backtest_strategies' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests', user?.id] });
      toast.success('Backtest deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete backtest');
    },
  });

  return {
    backtests: backtestsQuery.data || [],
    isLoading: backtestsQuery.isLoading,
    runBacktest: runMutation.mutate,
    saveBacktest: saveMutation.mutate,
    deleteBacktest: deleteMutation.mutate,
    isRunning: runMutation.isPending,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    lastResults: runMutation.data,
  };
}
