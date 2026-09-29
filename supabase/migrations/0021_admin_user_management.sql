-- 0021_admin_user_management.sql
-- Lets admins list all profiles and promote/demote admins.
-- Self-demotion is forbidden so the dashboard can't lock itself out.
--
-- Enum types used (must already exist):
--   public.user_role  {user, admin}

-- ----- list profiles -----

create or replace function public.admin_list_users(
  p_search text default null,
  p_limit  integer default 50,
  p_offset integer default 0
) returns table (
  id          uuid,
  email       text,
  username    text,
  avatar_url  text,
  role        text,
  created_at  timestamptz,
  total       bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
    select
      u.id,
      u.email::text,
      p.username,
      p.avatar_url,
      (coalesce(p.role, 'user'::public.user_role))::text,
      p.created_at,
      count(*) over () as total
    from auth.users u
    left join public.profiles p on p.id = u.id
    where p_search is null
       or p_search = ''
       or p.username ilike '%' || p_search || '%'
       or u.email::text ilike '%' || p_search || '%'
    order by (coalesce(p.role, 'user'::public.user_role) = 'admin') desc, p.created_at desc nulls last
    limit p_limit
    offset p_offset;
end;
$$;

grant execute on function public.admin_list_users(text, integer, integer) to authenticated;

-- ----- set role -----

create or replace function public.admin_set_user_role(
  p_user_id uuid,
  p_role    public.user_role
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_current  text;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_user_id = v_admin_id and p_role <> 'admin' then
    raise exception 'no puedes quitarte el rol de admin a ti mismo';
  end if;

  select role::text into v_current from public.profiles where id = p_user_id;

  insert into public.profiles (id, role, updated_at)
  values (p_user_id, p_role, now())
  on conflict (id) do update
    set role = excluded.role,
        updated_at = now();

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (
    v_admin_id,
    case when p_role = 'admin' then 'user.promoted' else 'user.demoted' end,
    'user',
    p_user_id,
    jsonb_build_object('previous_role', v_current, 'new_role', p_role::text)
  );
end;
$$;

grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;

-- ----- audit log entries for user role changes -----
-- No schema change needed: the AuditPage already falls back to the raw
-- action string when no label is found. The frontend label map adds the
-- 'user.promoted' / 'user.demoted' entries.