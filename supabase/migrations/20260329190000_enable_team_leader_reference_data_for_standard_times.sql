drop policy if exists "Job base settings team leader select" on public.job_base_settings;
create policy "Job base settings team leader select" on public.job_base_settings for
select to authenticated using (public.is_team_leader());

drop policy if exists "Machine equipment maintenances team leader select" on public.machine_equipment_maintenances;
create policy "Machine equipment maintenances team leader select" on public.machine_equipment_maintenances for
select to authenticated using (public.is_team_leader());