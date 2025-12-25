-- Create enum for feedback types
CREATE TYPE public.feedback_type AS ENUM ('bug', 'error', 'feature_request', 'listing', 'other');

-- Create enum for feedback status
CREATE TYPE public.feedback_status AS ENUM ('pending', 'approved', 'denied', 'in_progress', 'fixed', 'wont_fix', 'duplicate');

-- Create update_logs table for tracking platform updates
CREATE TABLE public.update_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    version TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_major BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feedback table for public feedback collection
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type feedback_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    contact_email TEXT,
    status feedback_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.update_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Public read access for update logs
CREATE POLICY "Anyone can view update logs"
ON public.update_logs
FOR SELECT
USING (true);

-- Public read access for feedback (people can see community feedback)
CREATE POLICY "Anyone can view feedback"
ON public.feedback
FOR SELECT
USING (true);

-- Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback"
ON public.feedback
FOR INSERT
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_feedback_updated_at();

-- Insert initial update logs based on project history
INSERT INTO public.update_logs (title, description, version, category, is_major, created_at) VALUES
('Initial Platform Launch', 'Created XLayer DeFi analytics platform with dark theme inspired by OKX DEX. Features include Dashboard, Protocols, DEXs, Yields, Stablecoins, Tokens, Chains, Fees, Security, Activities, and Donations pages.', '1.0.0', 'launch', true, '2025-01-20 00:00:00+00'),
('Real API Integration', 'Integrated DefiLlama API for protocols, TVL, yields, stablecoins, and fees data. Added CoinGecko proxy for token prices.', '1.1.0', 'integration', true, '2025-01-21 00:00:00+00'),
('Multi-language Support', 'Added internationalization with support for 8 languages: English, Spanish, Chinese, Japanese, Korean, French, German, and Portuguese.', '1.2.0', 'feature', true, '2025-01-25 00:00:00+00'),
('Sidebar Navigation Translation', 'Extended translations to sidebar navigation and footer components.', '1.2.1', 'i18n', false, '2025-01-25 01:00:00+00'),
('Page Translations - Part 1', 'Added multi-language support to Protocols, Tokens, Portfolio, Alerts, and DEXs pages.', '1.2.2', 'i18n', false, '2025-01-25 02:00:00+00'),
('Page Translations - Part 2', 'Added multi-language support to Yields, Stablecoins, Chains, Fees, Security, Activities, Donations, and Docs pages.', '1.2.3', 'i18n', false, '2025-01-25 03:00:00+00'),
('Builder Logs & Feedback System', 'Added Builder Logs page with update tracking and public feedback collection system for bugs, errors, feature requests, and listings.', '1.3.0', 'feature', true, now());