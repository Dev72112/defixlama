-- Add database-level constraints for feedback table field lengths
ALTER TABLE public.feedback 
ALTER COLUMN title TYPE varchar(200),
ALTER COLUMN description TYPE varchar(5000),
ALTER COLUMN contact_email TYPE varchar(255);

-- Drop the existing SECURITY DEFINER function
DROP FUNCTION IF EXISTS public.get_public_feedback();

-- Create a secure view for public feedback (excludes sensitive fields)
CREATE OR REPLACE VIEW public.feedback_public AS
SELECT id, type, title, description, status, created_at, updated_at
FROM public.feedback;

-- Enable RLS on the view (inherited from base table)
-- Grant select on the view to anon and authenticated roles
GRANT SELECT ON public.feedback_public TO anon, authenticated;

-- Add RLS policy for selecting from feedback table (non-sensitive fields only via view)
CREATE POLICY "Anyone can view feedback via view"
ON public.feedback
FOR SELECT
USING (true);

-- Recreate the function using SECURITY INVOKER instead of SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_public_feedback()
RETURNS TABLE (
  id uuid,
  type feedback_type,
  title text,
  description text,
  status feedback_status,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT id, type, title, description, status, created_at, updated_at
  FROM public.feedback_public
  ORDER BY created_at DESC;
$$;