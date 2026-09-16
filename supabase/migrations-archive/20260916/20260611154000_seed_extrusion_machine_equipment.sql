insert into public.machine_equipment_maintenances (
  unified_device_no,
  operation,
  machine_name
)
values
  ('JY-680T', '挤压', '680T'),
  ('JY-1000T', '挤压', '1000T'),
  ('JY-1400T', '挤压', '1400T')
on conflict (unified_device_no) do nothing;
