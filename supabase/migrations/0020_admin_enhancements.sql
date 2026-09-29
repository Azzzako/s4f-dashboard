-- 0020_admin_enhancements.sql
-- Adds optional reason to admin_set_report_status and bulk RPCs.
-- Apply after 0019_admin_moderation_rpc.sql.
--
-- Enum types used (must already exist):
--   public.spot_status       {pending, approved, rejected}
--   public.review_status     {pending, approved, rejected}
--   public.photo_status      {pending, approved, rejected}
--   public.report_status     {open, reviewed, dismissed}

-- ----- reason on report dismissal/review -----

create or replace function public.admin_set_report_status(
  p_report_id uuid,
  p_status    public.report_status,
  p_reason    text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_spot_id  uuid;
  v_reason   text;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select spot_id into v_spot_id from public.spot_reports where id = p_report_id;
  if v_spot_id is null then
    raise exception 'report not found';
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  update public.spot_reports
     set status = p_status
   where id = p_report_id;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  values (
    v_admin_id,
    case p_status
      when 'reviewed'  then 'report.reviewed'
      when 'dismissed' then 'report.dismissed'
      when 'open'      then 'report.open'
    end,
    'report',
    p_report_id,
    jsonb_build_object('spot_id', v_spot_id, 'reason', v_reason)
  );
end;
$$;

grant execute on function public.admin_set_report_status(uuid, public.report_status, text) to authenticated;

-- ----- bulk RPCs -----
-- One transaction per RPC: all-or-nothing. Each row still logs its own
-- audit entry so the trail stays per-item.

create or replace function public.admin_set_spots_status(
  p_ids    uuid[],
  p_status public.spot_status,
  p_reason text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_reason   text;
  v_count    integer;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if array_length(p_ids, 1) is null or array_length(p_ids, 1) = 0 then
    return 0;
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  update public.spots
     set status = p_status
   where id = any(p_ids);
  get diagnostics v_count = row_count;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  select
    v_admin_id,
    case p_status when 'approved' then 'spot.approved' when 'rejected' then 'spot.rejected' else 'spot.pending' end,
    'spot',
    s.id,
    jsonb_build_object('name', s.name, 'reason', v_reason)
  from public.spots s
  where s.id = any(p_ids);

  return v_count;
end;
$$;

grant execute on function public.admin_set_spots_status(uuid[], public.spot_status, text) to authenticated;

create or replace function public.admin_set_ratings_status(
  p_ids    uuid[],
  p_status public.review_status,
  p_reason text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_reason   text;
  v_count    integer;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if array_length(p_ids, 1) is null or array_length(p_ids, 1) = 0 then
    return 0;
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  update public.spot_ratings
     set status = p_status
   where id = any(p_ids);
  get diagnostics v_count = row_count;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  select
    v_admin_id,
    case p_status when 'approved' then 'rating.approved' when 'rejected' then 'rating.rejected' else 'rating.pending' end,
    'rating',
    r.id,
    jsonb_build_object('spot_id', r.spot_id, 'reason', v_reason)
  from public.spot_ratings r
  where r.id = any(p_ids);

  return v_count;
end;
$$;

grant execute on function public.admin_set_ratings_status(uuid[], public.review_status, text) to authenticated;

create or replace function public.admin_set_photos_status(
  p_ids    uuid[],
  p_status public.photo_status,
  p_reason text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_reason   text;
  v_count    integer;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if array_length(p_ids, 1) is null or array_length(p_ids, 1) = 0 then
    return 0;
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  update public.spot_photos
     set photo_status = p_status
   where id = any(p_ids);
  get diagnostics v_count = row_count;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  select
    v_admin_id,
    case p_status when 'approved' then 'photo.approved' when 'rejected' then 'photo.rejected' else 'photo.pending' end,
    'photo',
    p.id,
    jsonb_build_object('spot_id', p.spot_id, 'reason', v_reason)
  from public.spot_photos p
  where p.id = any(p_ids);

  return v_count;
end;
$$;

grant execute on function public.admin_set_photos_status(uuid[], public.photo_status, text) to authenticated;

create or replace function public.admin_set_reports_status(
  p_ids    uuid[],
  p_status public.report_status,
  p_reason text default null
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_reason   text;
  v_count    integer;
begin
  if v_admin_id is null or not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if array_length(p_ids, 1) is null or array_length(p_ids, 1) = 0 then
    return 0;
  end if;

  v_reason := nullif(btrim(coalesce(p_reason, '')), '');

  update public.spot_reports
     set status = p_status
   where id = any(p_ids);
  get diagnostics v_count = row_count;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, details)
  select
    v_admin_id,
    case p_status
      when 'reviewed'  then 'report.reviewed'
      when 'dismissed' then 'report.dismissed'
      when 'open'      then 'report.open'
    end,
    'report',
    r.id,
    jsonb_build_object('spot_id', r.spot_id, 'reason', v_reason)
  from public.spot_reports r
  where r.id = any(p_ids);

  return v_count;
end;
$$;

grant execute on function public.admin_set_reports_status(uuid[], public.report_status, text) to authenticated;