-- Create site_settings table for storing platform configuration
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view site settings (needed for frontend to read config)
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Only admins can insert site settings
CREATE POLICY "Admins can insert site settings"
ON public.site_settings
FOR INSERT
WITH CHECK (is_admin());

-- Only admins can update site settings
CREATE POLICY "Admins can update site settings"
ON public.site_settings
FOR UPDATE
USING (is_admin());

-- Only admins can delete site settings
CREATE POLICY "Admins can delete site settings"
ON public.site_settings
FOR DELETE
USING (is_admin());

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_feedback_updated_at();

-- Insert default settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('general', '{"site_name": "DeFi Dashboard", "site_description": "Your comprehensive DeFi analytics platform", "default_theme": "system"}', 'General site configuration'),
  ('features', '{"maintenance_mode": false, "analytics_enabled": true, "public_registration": true}', 'Feature toggles'),
  ('api', '{"rate_limit": 100, "cache_ttl": 300}', 'API configuration');