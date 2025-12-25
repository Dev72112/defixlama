-- Create a function to get public feedback (excludes sensitive fields)
CREATE OR REPLACE FUNCTION public.get_public_feedback()
RETURNS TABLE (
  id uuid,
  type feedback_type,
  title text,
  description text,
  status feedback_status,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, type, title, description, status, created_at, updated_at
  FROM public.feedback
  ORDER BY created_at DESC;
$$;