-- Add social media columns to token_listings table
ALTER TABLE public.token_listings 
ADD COLUMN IF NOT EXISTS twitter_url text,
ADD COLUMN IF NOT EXISTS telegram_url text;