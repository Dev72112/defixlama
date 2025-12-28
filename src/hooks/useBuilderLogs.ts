import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

export type FeedbackType = 'bug' | 'error' | 'feature_request' | 'listing' | 'other';
export type FeedbackStatus = 'pending' | 'approved' | 'denied' | 'in_progress' | 'fixed' | 'wont_fix' | 'duplicate';

// Zod schema for input validation
const feedbackInputSchema = z.object({
  type: z.enum(['bug', 'error', 'feature_request', 'listing', 'other']),
  title: z.string()
    .trim()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description must be less than 5000 characters'),
  contact_email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .or(z.literal('')),
});

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
      // Validate input using zod schema
      const validationResult = feedbackInputSchema.safeParse(input);
      
      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
        throw new Error(errorMessage);
      }
      
      const validatedInput = validationResult.data;
      
      // Clean up empty email
      const insertData = {
        type: validatedInput.type,
        title: validatedInput.title,
        description: validatedInput.description,
        ...(validatedInput.contact_email ? { contact_email: validatedInput.contact_email } : {}),
      };
      
      const { error } = await supabase
        .from('feedback')
        .insert([insertData]);

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
