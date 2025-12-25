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

// Public feedback (excludes sensitive fields like contact_email and admin_notes)
export interface FeedbackPublic {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
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
      // Use the secure RPC function that only returns non-sensitive fields
      const { data, error } = await supabase.rpc('get_public_feedback');
      
      if (error) throw error;
      return (data as unknown) as FeedbackPublic[];
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: FeedbackInput) => {
      // IMPORTANT: don't call .select() here.
      // The feedback table is not publicly selectable (to protect contact_email/admin_notes),
      // and requesting RETURNING data can trigger an RLS error.
      const { error } = await supabase
        .from('feedback')
        .insert([input]);

      if (error) throw error;
      return true;
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
