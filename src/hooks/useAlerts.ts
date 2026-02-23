import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export type AlertType = 'tvl_drop' | 'risk_increase' | 'governance_vote' | 'hack_detected' | 'price_move';

export interface UserAlert {
  id: string;
  user_id: string;
  protocol_slug: string;
  alert_type: AlertType;
  threshold: number | null;
  threshold_type: string | null;
  enabled: boolean;
  email_enabled: boolean;
  webhook_url: string | null;
  webhook_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateAlertInput {
  protocol_slug: string;
  alert_type: AlertType;
  threshold?: number;
  threshold_type?: string;
  email_enabled?: boolean;
  webhook_url?: string;
  webhook_enabled?: boolean;
}

export function useAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's alerts
  const alertsQuery = useQuery({
    queryKey: ['user-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase
        .from('user_alerts' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as UserAlert[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create alert
  const createAlertMutation = useMutation({
    mutationFn: async (input: CreateAlertInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await (supabase
        .from('user_alerts' as any)
        .insert([
          {
            user_id: user.id,
            protocol_slug: input.protocol_slug,
            alert_type: input.alert_type,
            threshold: input.threshold,
            threshold_type: input.threshold_type,
            email_enabled: input.email_enabled !== false,
            webhook_url: input.webhook_url,
            webhook_enabled: input.webhook_enabled ?? false,
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;
      return data as UserAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alerts', user?.id] });
      toast.success('Alert created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create alert');
    },
  });

  // Update alert
  const updateAlertMutation = useMutation({
    mutationFn: async (input: { id: string; enabled?: boolean; threshold?: number; webhook_url?: string; webhook_enabled?: boolean }) => {
      const { data, error } = await (supabase
        .from('user_alerts' as any)
        .update({
          ...(input.enabled !== undefined && { enabled: input.enabled }),
          ...(input.threshold !== undefined && { threshold: input.threshold }),
          ...(input.webhook_url !== undefined && { webhook_url: input.webhook_url }),
          ...(input.webhook_enabled !== undefined && { webhook_enabled: input.webhook_enabled }),
        })
        .eq('id', input.id)
        .select()
        .single() as any);

      if (error) throw error;
      return data as UserAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alerts', user?.id] });
      toast.success('Alert updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update alert');
    },
  });

  // Delete alert
  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('user_alerts' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alerts', user?.id] });
      toast.success('Alert deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete alert');
    },
  });

  return {
    alerts: alertsQuery.data || [],
    isLoading: alertsQuery.isLoading,
    createAlert: createAlertMutation.mutate,
    updateAlert: updateAlertMutation.mutate,
    deleteAlert: deleteAlertMutation.mutate,
    isCreating: createAlertMutation.isPending,
    isUpdating: updateAlertMutation.isPending,
    isDeleting: deleteAlertMutation.isPending,
  };
}
