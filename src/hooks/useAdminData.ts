import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';

type UpdateLog = Database['public']['Tables']['update_logs']['Row'];
type UpdateLogInsert = Database['public']['Tables']['update_logs']['Insert'];
type Feedback = Database['public']['Tables']['feedback']['Row'];
type FeedbackStatus = Database['public']['Enums']['feedback_status'];

// Token listing type (manual since types haven't regenerated yet)
interface TokenListing {
  id: string;
  name: string;
  symbol: string;
  contract_address: string | null;
  chain: string;
  logo_url: string | null;
  website_url: string | null;
  coingecko_id: string | null;
  description: string | null;
  twitter_url: string | null;
  telegram_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// Validation schemas
const updateLogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(2000),
  category: z.string().min(1, 'Category is required').max(50),
  version: z.string().max(20).nullable().optional(),
  is_major: z.boolean().optional(),
});

const tokenListingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  symbol: z.string().min(1, 'Symbol is required').max(20),
  contract_address: z.string().max(100).nullable().optional(),
  chain: z.string().min(1, 'Chain is required').max(50),
  logo_url: z.string().url().nullable().optional().or(z.literal('')),
  website_url: z.string().url().nullable().optional().or(z.literal('')),
  twitter_url: z.string().url().nullable().optional().or(z.literal('')),
  telegram_url: z.string().url().nullable().optional().or(z.literal('')),
  coingecko_id: z.string().max(100).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
});

export type UpdateLogInput = z.infer<typeof updateLogSchema>;
export type TokenListingInput = z.infer<typeof tokenListingSchema>;

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

// ============= TOKEN LISTINGS =============

// Fetch all token listings for admin
export function useAdminTokenListings() {
  return useQuery({
    queryKey: ['admin-token-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('token_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TokenListing[];
    },
  });
}

// Create token listing
export function useCreateTokenListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TokenListingInput) => {
      const validated = tokenListingSchema.parse(input);
      
      const { data, error } = await supabase
        .from('token_listings')
        .insert({
          name: validated.name,
          symbol: validated.symbol.toUpperCase(),
          contract_address: validated.contract_address || null,
          chain: validated.chain,
          logo_url: validated.logo_url || null,
          website_url: validated.website_url || null,
          twitter_url: validated.twitter_url || null,
          telegram_url: validated.telegram_url || null,
          coingecko_id: validated.coingecko_id || null,
          description: validated.description || null,
          is_active: validated.is_active ?? true,
          is_featured: validated.is_featured ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-token-listings'] });
      queryClient.invalidateQueries({ queryKey: ['token-prices'] });
      toast.success('Token listing created');
    },
    onError: (error) => {
      toast.error(`Failed to create listing: ${error.message}`);
    },
  });
}

// Update token listing
export function useUpdateTokenListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: TokenListingInput & { id: string }) => {
      const validated = tokenListingSchema.parse(input);
      
      const { data, error } = await supabase
        .from('token_listings')
        .update({
          name: validated.name,
          symbol: validated.symbol.toUpperCase(),
          contract_address: validated.contract_address || null,
          chain: validated.chain,
          logo_url: validated.logo_url || null,
          website_url: validated.website_url || null,
          twitter_url: validated.twitter_url || null,
          telegram_url: validated.telegram_url || null,
          coingecko_id: validated.coingecko_id || null,
          description: validated.description || null,
          is_active: validated.is_active ?? true,
          is_featured: validated.is_featured ?? false,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-token-listings'] });
      queryClient.invalidateQueries({ queryKey: ['token-prices'] });
      toast.success('Token listing updated');
    },
    onError: (error) => {
      toast.error(`Failed to update listing: ${error.message}`);
    },
  });
}

// Delete token listing
export function useDeleteTokenListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('token_listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-token-listings'] });
      queryClient.invalidateQueries({ queryKey: ['token-prices'] });
      toast.success('Token listing deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete listing: ${error.message}`);
    },
  });
}

// ============= SITE SETTINGS =============

interface SiteSetting {
  id: string;
  key: string;
  value: Record<string, any>;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeneralSettings {
  site_name: string;
  site_description: string;
  default_theme: 'system' | 'light' | 'dark';
}

export interface FeatureSettings {
  maintenance_mode: boolean;
  analytics_enabled: boolean;
  public_registration: boolean;
}

export interface ApiSettings {
  rate_limit: number;
  cache_ttl: number;
}

// Fetch all site settings
export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;
      
      // Convert array to object keyed by setting key
      const settings: Record<string, any> = {};
      (data as SiteSetting[])?.forEach((setting) => {
        settings[setting.key] = setting.value;
      });
      
      return {
        general: (settings.general || {}) as GeneralSettings,
        features: (settings.features || {}) as FeatureSettings,
        api: (settings.api || {}) as ApiSettings,
      };
    },
  });
}

// Update a site setting
export function useUpdateSiteSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { data, error } = await supabase
        .from('site_settings')
        .update({ value })
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });
}
