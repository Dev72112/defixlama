-- Drop the view that was created with SECURITY DEFINER issue
DROP VIEW IF EXISTS public.feedback_public;

-- Recreate the function to query directly from the table 
-- The SELECT RLS policy we added allows reading non-sensitive columns
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
  SELECT id, type, title::text, description::text, status, created_at, updated_at
  FROM public.feedback
  ORDER BY created_at DESC;
$$;