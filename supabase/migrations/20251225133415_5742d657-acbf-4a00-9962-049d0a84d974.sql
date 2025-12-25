-- Drop the existing public SELECT policy that exposes sensitive data
DROP POLICY IF EXISTS "Anyone can view feedback" ON public.feedback;

-- Create a view that excludes sensitive fields (contact_email, admin_notes)
CREATE OR REPLACE VIEW public.feedback_public AS
SELECT 
  id,
  title,
  description,
  type,
  status,
  created_at,
  updated_at
FROM public.feedback;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.feedback_public TO anon, authenticated;

-- Add a comment explaining the view
COMMENT ON VIEW public.feedback_public IS 'Public view of feedback that excludes sensitive fields like contact_email and admin_notes';