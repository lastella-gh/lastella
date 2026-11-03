-- The user directory follows the existing browser-to-Supabase admin access model.
-- Extend SELECT only; customers retain access to their own profile and role.
DROP POLICY "Own profile read" ON public.profiles;
CREATE POLICY "Own profile or admin read" ON public.profiles
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = id
  OR (SELECT private.has_role((SELECT auth.uid()), 'admin'))
);

DROP POLICY "Own roles read" ON public.user_roles;
CREATE POLICY "Own roles or admin read" ON public.user_roles
FOR SELECT TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT private.has_role((SELECT auth.uid()), 'admin'))
);
