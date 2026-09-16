create or replace function public.apply_job_base_hourly_fee_to_process_standard() returns trigger language plpgsql as $$
declare matched_hourly_fee numeric(14, 8);
begin if new.job_name is null then return new;
end if;
if tg_op = 'UPDATE'
and new.job_name is not distinct
from old.job_name then return new;
end if;
select jbs.hourly_fee into matched_hourly_fee
from public.job_base_settings as jbs
where jbs.job_name = new.job_name
limit 1;
if matched_hourly_fee is null then return new;
end if;
if (
  tg_op = 'INSERT'
  and coalesce(new.labor_rate, 0) = 0
)
or (
  tg_op = 'UPDATE'
  and new.job_name is distinct
  from old.job_name
    and (
      new.labor_rate is null
      or coalesce(new.labor_rate, 0) = 0
      or new.labor_rate is not distinct
      from old.labor_rate
    )
) then new.labor_rate = round(matched_hourly_fee::numeric, 4);
end if;
return new;
end;
$$;
drop trigger if exists apply_job_base_hourly_fee_to_process_standard on public.process_standards;
create trigger apply_job_base_hourly_fee_to_process_standard before
insert
  or
update of job_name on public.process_standards for each row execute function public.apply_job_base_hourly_fee_to_process_standard();
create or replace function public.sync_process_standard_labor_rate_from_job_base_setting() returns trigger language plpgsql as $$
declare old_hourly_fee numeric(10, 4);
declare new_hourly_fee numeric(10, 4);
begin if tg_op = 'UPDATE' then old_hourly_fee = round(coalesce(old.hourly_fee, 0)::numeric, 4);
else old_hourly_fee = round(coalesce(new.hourly_fee, 0)::numeric, 4);
end if;
new_hourly_fee = round(coalesce(new.hourly_fee, 0)::numeric, 4);
if tg_op = 'UPDATE'
and new.job_name is not distinct
from old.job_name
  and new_hourly_fee is not distinct
from old_hourly_fee then return new;
end if;
update public.process_standards as ps
set labor_rate = new_hourly_fee
where (
    ps.job_name = new.job_name
    or (
      tg_op = 'UPDATE'
      and ps.job_name = old.job_name
    )
  )
  and ps.labor_rate is not distinct
from old_hourly_fee;
return new;
end;
$$;
drop trigger if exists sync_process_standard_labor_rate_from_job_base_setting on public.job_base_settings;
create trigger sync_process_standard_labor_rate_from_job_base_setting
after
insert
  or
update on public.job_base_settings for each row execute function public.sync_process_standard_labor_rate_from_job_base_setting();
update public.process_standards as ps
set labor_rate = round(jbs.hourly_fee::numeric, 4)
from public.job_base_settings as jbs
where ps.job_name = jbs.job_name
  and ps.labor_rate is distinct
from round(jbs.hourly_fee::numeric, 4);