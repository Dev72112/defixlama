-- Add admin policies for update_logs table
CREATE POLICY "Admins can insert update logs"
ON public.update_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update update logs"
ON public.update_logs
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete update logs"
ON public.update_logs
FOR DELETE
TO authenticated
USING (public.is_admin());