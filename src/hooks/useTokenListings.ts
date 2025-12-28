// Hook to fetch public token listings from database
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TokenListing {
  id: string;
  name: string;
  symbol: string;
  contract_address: string | null;
  chain: string;
  logo_url: string | null;
  website_url: string | null;
  coingecko_id: string | null;
  description: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all active public token listings
export function usePublicTokenListings() {
  return useQuery({
    queryKey: ['public-token-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('token_listings')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TokenListing[];
    },
    staleTime: 60 * 1000, // Cache for 1 minute
  });
}

// Fetch a single token listing by id, symbol, or contract address
export function useTokenListingDetail(identifier: string | null) {
  return useQuery({
    queryKey: ['token-listing-detail', identifier],
    queryFn: async () => {
      if (!identifier) return null;
      
      const lower = identifier.toLowerCase();
      
      // Try to find by ID first
      let { data, error } = await supabase
        .from('token_listings')
        .select('*')
        .eq('id', identifier)
        .eq('is_active', true)
        .maybeSingle();
      
      if (data) return data as TokenListing;
      
      // Try by coingecko_id
      ({ data, error } = await supabase
        .from('token_listings')
        .select('*')
        .eq('coingecko_id', lower)
        .eq('is_active', true)
        .maybeSingle());
      
      if (data) return data as TokenListing;
      
      // Try by symbol (case-insensitive)
      ({ data, error } = await supabase
        .from('token_listings')
        .select('*')
        .ilike('symbol', identifier)
        .eq('is_active', true)
        .maybeSingle());
      
      if (data) return data as TokenListing;
      
      // Try by contract address
      ({ data, error } = await supabase
        .from('token_listings')
        .select('*')
        .ilike('contract_address', identifier)
        .eq('is_active', true)
        .maybeSingle());
      
      return data as TokenListing | null;
    },
    enabled: !!identifier,
    staleTime: 60 * 1000,
  });
}
