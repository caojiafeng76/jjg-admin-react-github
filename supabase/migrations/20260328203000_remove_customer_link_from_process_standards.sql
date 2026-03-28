create or replace function public.apply_machine_equipment_defaults_to_process_standard() returns trigger language plpgsql as $$
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
return new;
end;
$$;
create or replace function public.sync_process_standard_machine_equipment_fields() returns trigger language plpgsql as $$
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
set equipment_rate = case
    when ps.equipment_rate is not distinct
    from old_hourly_rate then new_hourly_rate
      else ps.equipment_rate
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