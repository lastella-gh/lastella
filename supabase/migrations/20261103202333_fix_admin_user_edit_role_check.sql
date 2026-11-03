-- The service role checks the authorization table directly without requiring
-- access to the private schema. Preserve the service-only invoker function.
CREATE OR REPLACE FUNCTION public.admin_update_user_details(
  p_actor_id uuid,
  p_user_id uuid,
  p_full_name text,
  p_phone text,
  p_role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- Serialize role changes and recheck authorization after acquiring the lock.
  -- Two admins cannot concurrently demote each other and leave no admin.
  PERFORM pg_catalog.pg_advisory_xact_lock(73240895612433::bigint);

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_actor_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Administrator access is required';
  END IF;
  IF p_role IS NULL THEN
    RAISE EXCEPTION 'A user role is required';
  END IF;
  IF p_actor_id = p_user_id AND p_role <> 'admin' THEN
    RAISE EXCEPTION 'You cannot remove your own admin role';
  END IF;
  IF p_full_name IS NULL OR char_length(btrim(p_full_name)) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Name must be between 1 and 200 characters';
  END IF;
  IF char_length(coalesce(p_phone, '')) > 40 THEN
    RAISE EXCEPTION 'Phone must be 40 characters or fewer';
  END IF;

  UPDATE public.profiles
  SET full_name = btrim(p_full_name), phone = nullif(btrim(p_phone), '')
  WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile was not found';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = excluded.role;
END;
$$;

