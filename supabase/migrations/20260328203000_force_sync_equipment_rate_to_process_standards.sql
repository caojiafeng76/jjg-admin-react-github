create or replace function public.sync_process_standard_equipment_rate_from_machine_equipment_maintenance()
returns trigger
language plpgsql
as $$
declare
  new_hourly_rate numeric(10, 4);
begin
  new_hourly_rate = round(coalesce(new.equipment_hourly_rate, 0)::numeric, 4);

  if tg_op = 'UPDATE'
    and new.unified_device_no is not distinct from old.unified_device_no
    and new_hourly_rate is not distinct from round(coalesce(old.equipment_hourly_rate, 0)::numeric, 4) then
    return new;
  end if;

  update public.process_standards as ps
  set equipment_rate = new_hourly_rate
  where ps.equipment_no = new.unified_device_no
     or (
       tg_op = 'UPDATE'
       and ps.equipment_no = old.unified_device_no
     );

  return new;
end;
$$;