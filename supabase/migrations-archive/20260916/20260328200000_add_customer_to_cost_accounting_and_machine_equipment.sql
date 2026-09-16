alter table public.machine_equipment_maintenances
add column if not exists customer text;
comment on column public.machine_equipment_maintenances.customer is '客户';
alter table public.process_standards
add column if not exists customer text;
comment on column public.process_standards.customer is '客户';
create or replace function public.apply_machine_equipment_defaults_to_process_standard() returns trigger language plpgsql as $$
declare matched_hourly_rate numeric(14, 8);
matched_customer text;
begin if new.equipment_no is null then new.customer = null;
return new;
end if;
if tg_op = 'UPDATE'
and new.equipment_no is not distinct
from old.equipment_no then return new;
end if;
select mem.equipment_hourly_rate,
  mem.customer into matched_hourly_rate,
  matched_customer
from public.machine_equipment_maintenances as mem
where mem.unified_device_no = new.equipment_no
limit 1;
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
) then if matched_hourly_rate is not null then new.equipment_rate = round(matched_hourly_rate::numeric, 4);
end if;
end if;
if tg_op = 'INSERT'
or new.equipment_no is distinct
from coalesce(old.equipment_no, '')
  or coalesce(btrim(new.customer), '') = '' then new.customer = nullif(btrim(coalesce(matched_customer, '')), '');
end if;
return new;
end;
$$;
drop trigger if exists apply_machine_equipment_hourly_rate_to_process_standard on public.process_standards;
drop trigger if exists apply_machine_equipment_defaults_to_process_standard on public.process_standards;
create trigger apply_machine_equipment_defaults_to_process_standard before
insert
  or
update of equipment_no on public.process_standards for each row execute function public.apply_machine_equipment_defaults_to_process_standard();
create or replace function public.sync_process_standard_machine_equipment_fields() returns trigger language plpgsql as $$
declare old_hourly_rate numeric(10, 4);
new_hourly_rate numeric(10, 4);
old_customer text;
new_customer text;
begin if tg_op = 'UPDATE' then old_hourly_rate = round(
  coalesce(old.equipment_hourly_rate, 0)::numeric,
  4
);
old_customer = nullif(btrim(coalesce(old.customer, '')), '');
else old_hourly_rate = 0;
old_customer = null;
end if;
new_hourly_rate = round(
  coalesce(new.equipment_hourly_rate, 0)::numeric,
  4
);
new_customer = nullif(btrim(coalesce(new.customer, '')), '');
if tg_op = 'UPDATE'
and new.unified_device_no is not distinct
from old.unified_device_no
  and new_hourly_rate is not distinct
from old_hourly_rate
  and new_customer is not distinct
from old_customer then return new;
end if;
update public.process_standards as ps
set equipment_rate = case
    when ps.equipment_rate is not distinct
    from old_hourly_rate then new_hourly_rate
      else ps.equipment_rate
  end,
  customer = case
    when ps.customer is null
    or ps.customer is not distinct
    from old_customer then new_customer
      else ps.customer
  end
where (
    ps.equipment_no = new.unified_device_no
    or (
      tg_op = 'UPDATE'
      and ps.equipment_no = old.unified_device_no
    )
  );
return new;
end;
$$;
drop trigger if exists sync_process_standard_equipment_rate_from_machine_equipment_maintenance on public.machine_equipment_maintenances;
drop trigger if exists sync_process_standard_machine_equipment_fields on public.machine_equipment_maintenances;
create trigger sync_process_standard_machine_equipment_fields
after
insert
  or
update on public.machine_equipment_maintenances for each row execute function public.sync_process_standard_machine_equipment_fields();