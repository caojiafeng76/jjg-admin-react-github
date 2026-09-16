drop policy if exists "Quality rework repairs admin all" on public.quality_rework_repairs;

drop policy if exists "Quality rework repairs permission rw" on public.quality_rework_repairs;
create policy "Quality rework repairs permission rw" on public.quality_rework_repairs for all to authenticated using (
  public.current_user_has_permission('page:quality-rework-repair')
) with check (
  public.current_user_has_permission('page:quality-rework-repair')
);;
