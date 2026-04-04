-- 视图：出勤明细 + 班别（关联生产工单）
-- 通过 employees.name = attendance_details.name，再关联 production_orders.employee_id + order_date
-- 若该日无生产工单，则班别默认为"白班"
create or replace view public.attendance_details_with_shift as
select
  ad.id,
  ad.name,
  ad.date,
  ad.time,
  ad.created_at,
  ad.updated_at,
  coalesce(po.shift, '白班') as shift
from public.attendance_details as ad
left join public.employees as e on e.name = ad.name
left join public.production_orders as po
  on po.employee_id = e.id
  and po.order_date = ad.date;

-- RLS：视图不直接继承，允许 authenticated 用户访问（读取）
-- 注意：视图默认使用 SECURITY DEFINER（受限），需要 grant
grant select on public.attendance_details_with_shift to authenticated;

-- RPC：按姓名统计出勤天数、白班天数、夜班天数
create or replace function public.get_attendance_shift_stats(
  p_start_date date default null,
  p_end_date   date default null,
  p_name       text default null
)
returns table (
  name            text,
  total_days      bigint,
  day_shift_days  bigint,
  night_shift_days bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sub.name,
    count(distinct sub.date) as total_days,
    count(distinct case when sub.shift = '白班' then sub.date end) as day_shift_days,
    count(distinct case when sub.shift = '夜班' then sub.date end) as night_shift_days
  from (
    select
      ad.name,
      ad.date,
      coalesce(po.shift, '白班') as shift
    from public.attendance_details as ad
    left join public.employees as e on e.name = ad.name
    left join public.production_orders as po
      on po.employee_id = e.id
      and po.order_date = ad.date
    where
      (p_start_date is null or ad.date >= p_start_date)
      and (p_end_date is null or ad.date <= p_end_date)
      and (p_name is null or p_name = '' or ad.name ilike '%' || p_name || '%')
  ) as sub
  group by sub.name
  order by sub.name asc;
$$;

grant execute on function public.get_attendance_shift_stats(date, date, text) to authenticated;
