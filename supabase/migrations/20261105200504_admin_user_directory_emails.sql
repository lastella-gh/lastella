-- Read only the Auth columns required by the admin directory. Browser roles
-- receive no Auth grants and cannot call the service-only invoker function.
GRANT SELECT (id, email, created_at) ON auth.users TO service_role;

CREATE FUNCTION public.admin_list_users(p_search text, p_offset integer, p_limit integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH filtered AS (
    SELECT u.id, p.full_name, p.phone, u.email, u.created_at, r.role
    FROM auth.users AS u
    LEFT JOIN public.profiles AS p ON p.id = u.id
    LEFT JOIN public.user_roles AS r ON r.user_id = u.id
    WHERE position(
      lower(btrim(coalesce(p_search, ''))) IN
      lower(coalesce(p.full_name, '') || ' ' || coalesce(p.phone, '') || ' ' || coalesce(u.email, ''))
    ) > 0
  ), page AS (
    SELECT * FROM filtered
    ORDER BY created_at DESC, id
    LIMIT greatest(1, least(coalesce(p_limit, 25), 100))
    OFFSET greatest(coalesce(p_offset, 0), 0)
  )
  SELECT jsonb_build_object(
    'users', coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at DESC, id) FROM page), '[]'::jsonb),
    'count', (SELECT count(*) FROM filtered)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_list_users(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(text, integer, integer) TO service_role;
