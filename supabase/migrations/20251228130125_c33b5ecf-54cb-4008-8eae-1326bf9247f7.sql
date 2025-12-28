-- Create token_listings table for managing listed tokens
CREATE TABLE public.token_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  contract_address TEXT,
  chain TEXT NOT NULL DEFAULT 'ethereum',
  logo_url TEXT,
  website_url TEXT,
  coingecko_id TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.token_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Anyone can view active token listings"
ON public.token_listings
FOR SELECT
USING (is_active = true);

-- Admins can view all listings
CREATE POLICY "Admins can view all token listings"
ON public.token_listings
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Admins can insert listings
CREATE POLICY "Admins can insert token listings"
ON public.token_listings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Admins can update listings
CREATE POLICY "Admins can update token listings"
ON public.token_listings
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Admins can delete listings
CREATE POLICY "Admins can delete token listings"
ON public.token_listings
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Create updated_at trigger
CREATE TRIGGER update_token_listings_updated_at
BEFORE UPDATE ON public.token_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_feedback_updated_at();