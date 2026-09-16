drop policy if exists "Machine equipment maintenances authenticated select" on public.machine_equipment_maintenances;
create policy "Machine equipment maintenances authenticated select" on public.machine_equipment_maintenances for
select to authenticated using (true);