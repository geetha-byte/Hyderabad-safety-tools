CREATE OR REPLACE FUNCTION public.admin_list_users(_page integer DEFAULT 1)
RETURNS TABLE(id uuid, email text, verified boolean, created_at timestamptz, is_admin boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY SELECT u.id, u.email::text, u.email_confirmed_at IS NOT NULL, u.created_at,
    EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin')
  FROM auth.users u ORDER BY u.created_at DESC
  LIMIT 21 OFFSET (GREATEST(_page,1) - 1) * 20;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(_user_id uuid, _make_admin boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _user_id = auth.uid() THEN RAISE EXCEPTION 'You cannot change your own role.'; END IF;
  SELECT email, email_confirmed_at INTO t FROM auth.users WHERE id = _user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  IF lower(t.email) = 'manojenterprisesinfo@gmail.com' THEN RAISE EXCEPTION 'The store owner''s admin role cannot be changed.'; END IF;
  IF _make_admin THEN
    IF t.email_confirmed_at IS NULL THEN RAISE EXCEPTION 'The user must verify their email before becoming an admin.'; END IF;
    INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.admin_list_users(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, boolean) TO authenticated;