-- Fix 1: Update site_settings to only allow admins to view (except non-sensitive settings)
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;

-- Create admin-only SELECT policy for site_settings
CREATE POLICY "Only admins can view site settings"
ON public.site_settings
FOR SELECT
USING (is_admin());

-- Fix 2: Add missing INSERT policy for profiles (needed for user registration flow via trigger)
-- The handle_new_user trigger runs with SECURITY DEFINER, so it can insert
-- But we should still have a policy for direct inserts if needed
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Fix 3: Add protection policies for user_roles table to prevent privilege escalation
-- Only admins can insert roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin());

-- Only admins can update roles  
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (is_admin());

-- Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (is_admin());

-- Fix 4: Remove email from profiles table to avoid data exposure
-- Email is already stored in auth.users, no need to duplicate
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;