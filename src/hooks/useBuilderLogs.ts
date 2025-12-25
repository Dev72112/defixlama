import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type FeedbackType = 'bug' | 'error' | 'feature_request' | 'listing' | 'other';
export type FeedbackStatus = 'pending' | 'approved' | 'denied' | 'in_progress' | 'fixed' | 'wont_fix' | 'duplicate';

export interface UpdateLog {
  id: string;
  title: string;
  description: string;
  version: string | null;
  category: string;
  is_major: boolean;
  created_at: string;
}

export interface Feedback {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  contact_email: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackInput {
  type: FeedbackType;
  title: string;
  description: string;
  contact_email?: string;
}

export function useUpdateLogs() {
  return useQuery({
    queryKey: ['update-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('update_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UpdateLog[];
    },
  });
}

export function useFeedback() {
  return useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Feedback[];
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: FeedbackInput) => {
      const { data, error } = await supabase
        .from('feedback')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast.success('Feedback submitted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to submit feedback: ' + error.message);
    },
  });
}
