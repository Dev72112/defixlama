import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface APIKey {
  id: string;
  user_id: string;
  key_prefix: string; // first 8 chars visible
  key_hash: string; // sha256 hash
  name: string;
  quota_daily: number;
  enabled: boolean;
  last_used: string | null;
  created_at: string;
  updated_at: string;
}

interface CreateAPIKeyInput {
  name: string;
  quota_daily?: number;
}

// Generate a random API key
function generateAPIKey(): string {
  return `xlama_${crypto.getRandomValues(new Uint8Array(24)).reduce((a, b) => a + ('0' + b.toString(16)).slice(-2), '')}`;
}

// Hash the API key (mock for frontend - real hashing should be server-side)
function hashAPIKey(key: string): string {
  // In production, this should be done server-side
  return btoa(key).substring(0, 32);
}

// Get visible prefix (first 8 chars after xlama_)
function getKeyPrefix(key: string): string {
  return key.substring(0, 8);
}

export function useAPIKeys() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch API keys
  const keysQuery = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await (supabase
        .from('api_keys' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return data as APIKey[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Create API key
  const createKeyMutation = useMutation({
    mutationFn: async (input: CreateAPIKeyInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const newKey = generateAPIKey();
      const keyHash = hashAPIKey(newKey);
      const keyPrefix = getKeyPrefix(newKey);

      const { data, error } = await (supabase
        .from('api_keys' as any)
        .insert([
          {
            user_id: user.id,
            key_prefix: keyPrefix,
            key_hash: keyHash,
            name: input.name,
            quota_daily: input.quota_daily || 10000,
            enabled: true,
          },
        ])
        .select()
        .single() as any);

      if (error) throw error;

      // Return the key only once (not stored after this)
      return {
        ...data,
        fullKey: newKey, // Include full key in response
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', user?.id] });
      toast.success('API key created');
      // Show the key to user in a toast or dialog
      console.log('NEW API KEY:', data.fullKey);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create API key');
    },
  });

  // Update API key
  const updateKeyMutation = useMutation({
    mutationFn: async (input: { id: string; name?: string; quota_daily?: number; enabled?: boolean }) => {
      const { data, error } = await (supabase
        .from('api_keys' as any)
        .update({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.quota_daily !== undefined && { quota_daily: input.quota_daily }),
          ...(input.enabled !== undefined && { enabled: input.enabled }),
        })
        .eq('id', input.id)
        .select()
        .single() as any);

      if (error) throw error;
      return data as APIKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', user?.id] });
      toast.success('API key updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update API key');
    },
  });

  // Delete API key
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('api_keys' as any).delete().eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', user?.id] });
      toast.success('API key deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete API key');
    },
  });

  return {
    keys: keysQuery.data || [],
    isLoading: keysQuery.isLoading,
    createKey: createKeyMutation.mutate,
    updateKey: updateKeyMutation.mutate,
    deleteKey: deleteKeyMutation.mutate,
    isCreating: createKeyMutation.isPending,
    isUpdating: updateKeyMutation.isPending,
    isDeleting: deleteKeyMutation.isPending,
    newKeyData: createKeyMutation.data,
  };
}
