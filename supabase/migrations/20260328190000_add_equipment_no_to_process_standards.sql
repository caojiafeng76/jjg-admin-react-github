alter table public.process_standards
add column if not exists equipment_no text;
comment on column public.process_standards.equipment_no is '设备编号，关联机器设备维护统一设备编号';
create index if not exists idx_process_standards_equipment_no on public.process_standards (equipment_no);
do $$ begin if not exists (
  select 1
  from pg_constraint
  where conname = 'process_standards_equipment_no_fkey'
    and conrelid = 'public.process_standards'::regclass
) then
alter table public.process_standards
add constraint process_standards_equipment_no_fkey foreign key (equipment_no) references public.machine_equipment_maintenances (unified_device_no) on update cascade on delete
set null;
end if;
end $$;
create or replace function public.apply_machine_equipment_hourly_rate_to_process_standard() returns trigger language plpgsql as $$
declare matched_hourly_rate numeric(14, 8);
begin if new.equipment_no is null then return new;
end if;
if tg_op = 'UPDATE'
and new.equipment_no is not distinct
from old.equipment_no then return new;
end if;
select mem.equipment_hourly_rate into matched_hourly_rate
from public.machine_equipment_maintenances as mem
where mem.unified_device_no = new.equipment_no
limit 1;
if matched_hourly_rate is null then return new;
end if;
if (
  tg_op = 'INSERT'
  and coalesce(new.equipment_rate, 0) = 0
)
or (
  tg_op = 'UPDATE'
  and new.equipment_no is distinct
  from old.equipment_no
    and (
      new.equipment_rate is null
      or coalesce(new.equipment_rate, 0) = 0
      or new.equipment_rate is not distinct
      from old.equipment_rate
    )
) then new.equipment_rate = round(matched_hourly_rate::numeric, 4);
end if;
return new;
end;
$$;
drop trigger if exists apply_machine_equipment_hourly_rate_to_process_standard on public.process_standards;
create trigger apply_machine_equipment_hourly_rate_to_process_standard before
insert
  or
update of equipment_no on public.process_standards for each row execute function public.apply_machine_equipment_hourly_rate_to_process_standard();
create or replace function public.sync_process_standard_equipment_rate_from_machine_equipment_maintenance() returns trigger language plpgsql as $$
declare old_hourly_rate numeric(10, 4);
new_hourly_rate numeric(10, 4);
begin if tg_op = 'UPDATE' then old_hourly_rate = round(
  coalesce(old.equipment_hourly_rate, 0)::numeric,
  4
);
else old_hourly_rate = 0;
end if;
new_hourly_rate = round(
  coalesce(new.equipment_hourly_rate, 0)::numeric,
  4
);
if tg_op = 'UPDATE'
and new.unified_device_no is not distinct
from old.unified_device_no
  and new_hourly_rate is not distinct
from old_hourly_rate then return new;
end if;
update public.process_standards as ps
set equipment_rate = new_hourly_rate
where (
    ps.equipment_no = new.unified_device_no
    or (
      tg_op = 'UPDATE'
      and ps.equipment_no = old.unified_device_no
    )
  )
  and ps.equipment_rate is not distinct
from old_hourly_rate;
return new;
end;
$$;
drop trigger if exists sync_process_standard_equipment_rate_from_machine_equipment_maintenance on public.machine_equipment_maintenances;
create trigger sync_process_standard_equipment_rate_from_machine_equipment_maintenance
after
insert
  or
update on public.machine_equipment_maintenances for each row execute function public.sync_process_standard_equipment_rate_from_machine_equipment_maintenance();