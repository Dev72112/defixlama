import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

type UpdateLog = Database['public']['Tables']['update_logs']['Row'];
type UpdateLogInsert = Database['public']['Tables']['update_logs']['Insert'];
type Feedback = Database['public']['Tables']['feedback']['Row'];
type FeedbackStatus = Database['public']['Enums']['feedback_status'];

// Validation schemas
const updateLogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  category: z.string().min(1, 'Category is required').max(50),
  version: z.string().max(20).nullable().optional(),
  is_major: z.boolean().optional(),
});

export type UpdateLogInput = z.infer<typeof updateLogSchema>;

// Fetch all update logs for admin
export function useAdminUpdateLogs() {
  return useQuery({
    queryKey: ['admin-update-logs'],
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

// Create update log
export function useCreateUpdateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateLogInput) => {
      const validated = updateLogSchema.parse(input);
      
      const { data, error } = await supabase
        .from('update_logs')
        .insert({
          title: validated.title,
          description: validated.description,
          category: validated.category,
          version: validated.version || null,
          is_major: validated.is_major || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-update-logs'] });
      queryClient.invalidateQueries({ queryKey: ['update-logs'] });
      toast.success('Update log created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create update log: ${error.message}`);
    },
  });
}

// Update update log
export function useUpdateUpdateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateLogInput & { id: string }) => {
      const validated = updateLogSchema.parse(input);
      
      const { data, error } = await supabase
        .from('update_logs')
        .update({
          title: validated.title,
          description: validated.description,
          category: validated.category,
          version: validated.version || null,
          is_major: validated.is_major || false,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-update-logs'] });
      queryClient.invalidateQueries({ queryKey: ['update-logs'] });
      toast.success('Update log updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
}

// Delete update log
export function useDeleteUpdateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('update_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-update-logs'] });
      queryClient.invalidateQueries({ queryKey: ['update-logs'] });
      toast.success('Update log deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });
}

// Fetch all feedback for admin (includes admin_notes and contact_email)
export function useAdminFeedback() {
  return useQuery({
    queryKey: ['admin-feedback'],
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

// Update feedback status/notes
export function useUpdateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      admin_notes 
    }: { 
      id: string; 
      status?: FeedbackStatus; 
      admin_notes?: string;
    }) => {
      const updates: Partial<Feedback> = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;

      const { data, error } = await supabase
        .from('feedback')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast.success('Feedback updated');
    },
    onError: (error) => {
      toast.error(`Failed to update feedback: ${error.message}`);
    },
  });
}

// Delete feedback
export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      toast.success('Feedback deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete feedback: ${error.message}`);
    },
  });
}
