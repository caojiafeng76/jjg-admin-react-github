create or replace function public.get_job_base_setting_options()
returns table (job_name text, hourly_fee numeric)
language sql
stable
security definer
set search_path = public as $$
select jbs.job_name, jbs.hourly_fee
from public.job_base_settings as jbs
order by jbs.job_name asc
$$;

grant execute on function public.get_job_base_setting_options() to authenticated;

create or replace function public.get_job_hourly_fee(target_job_name text)
returns numeric
language sql
stable
security definer
set search_path = public as $$
select jbs.hourly_fee
from public.job_base_settings as jbs
where jbs.job_name = target_job_name
limit 1
$$;

grant execute on function public.get_job_hourly_fee(text) to authenticated;