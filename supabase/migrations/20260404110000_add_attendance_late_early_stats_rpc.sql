-- RPC：按姓名统计迟到/早退次数及对应日期
-- 迟到规则：
--   白班：当日 MIN(time) > 07:05
--   夜班：当日 MAX(time) > 19:05（傍晚那次打卡是上班时间）
-- 早退规则：
--   白班：当日 MAX(time) < (07:00 + work_hours - 5min)
--   夜班(work_hours>5 跨午夜)：次日清晨 MIN(time<12:00) < (19:00 + work_hours - 5min) mod 86400
--   夜班(work_hours<=5 不跨午夜)：当日 MAX(time) < (19:00 + work_hours - 5min)
create or replace function public.get_attendance_late_early_stats(
  p_start_date date default null,
  p_end_date   date default null,
  p_name       text default null
)
returns table (
  name               text,
  late_count         bigint,
  late_dates         text[],
  early_leave_count  bigint,
  early_leave_dates  text[]
)
language sql
stable
security definer
set search_path = public
as $$
with
base as (
  select
    ad.name,
    ad.date,
    coalesce(po.shift, '白班') as shift,
    po.work_hours::numeric      as work_hours,
    min(ad.time::time)          as first_punch,
    max(ad.time::time)          as last_punch
  from public.attendance_details as ad
  left join public.employees as e on e.name = ad.name
  left join lateral (
    select shift, work_hours
    from public.production_orders
    where employee_id = e.id and order_date = ad.date
    order by created_at desc
    limit 1
  ) as po on true
  where
    (p_start_date is null or ad.date >= p_start_date)
    and (p_end_date is null or ad.date <= p_end_date)
    and (p_name is null or p_name = '' or ad.name ilike '%' || p_name || '%')
  group by ad.name, ad.date, po.shift, po.work_hours
),
next_morning as (
  select name, date, min(time::time) as checkout
  from public.attendance_details
  where time::time < '12:00:00'::time
  group by name, date
),
late_records as (
  select name, date
  from base
  where
    (shift = '白班' and first_punch > '07:05:00'::time)
    or (shift = '夜班' and last_punch  > '19:05:00'::time)
),
early_leave_records as (
  select b.name, b.date
  from base b
  where b.work_hours is not null
    and (
      (
        b.shift = '白班'
        and b.last_punch < '07:00:00'::time
              + (b.work_hours * interval '1 hour')
              - interval '5 minutes'
      )
      or
      (
        b.shift = '夜班' and b.work_hours > 5
        and exists (
          select 1
          from next_morning nm
          where nm.name = b.name
            and nm.date  = (b.date + interval '1 day')::date
            and extract(epoch from nm.checkout)
                < (19 + b.work_hours) * 3600 - 86400 - 300
        )
      )
      or
      (
        b.shift = '夜班' and b.work_hours <= 5
        and b.last_punch < '19:00:00'::time
              + (b.work_hours * interval '1 hour')
              - interval '5 minutes'
      )
    )
),
all_names as (
  select distinct name from base
)
select
  n.name,
  coalesce(l.cnt,  0)           as late_count,
  coalesce(l.dates, '{}')       as late_dates,
  coalesce(el.cnt, 0)           as early_leave_count,
  coalesce(el.dates, '{}')      as early_leave_dates
from all_names n
left join (
  select name, count(*) as cnt, array_agg(date::text order by date) as dates
  from late_records group by name
) l  on l.name  = n.name
left join (
  select name, count(*) as cnt, array_agg(date::text order by date) as dates
  from early_leave_records group by name
) el on el.name = n.name
order by n.name;
$$;

grant execute on function public.get_attendance_late_early_stats(date, date, text) to authenticated;
