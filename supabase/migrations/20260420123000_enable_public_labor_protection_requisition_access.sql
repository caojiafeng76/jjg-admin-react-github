drop policy if exists "Labor protection data public read" on public.labor_protection_data;
create policy "Labor protection data public read" on public.labor_protection_data for
select to anon,
  authenticated using (true);
drop policy if exists "Labor protection requisitions public insert" on public.labor_protection_requisitions;
create policy "Labor protection requisitions public insert" on public.labor_protection_requisitions for
insert to anon,
  authenticated with check (
    labor_protection_data_id is not null
    and btrim(job_title) <> ''
    and quantity > 0
    and btrim(recipient) <> ''
  );