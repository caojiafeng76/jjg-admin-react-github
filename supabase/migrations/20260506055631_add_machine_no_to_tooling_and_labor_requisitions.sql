alter table public.labor_protection_requisitions
  add column if not exists machine_equipment_id uuid null references public.machine_equipment_maintenances (id) on update cascade on delete set null;

alter table public.tooling_stock_out
  add column if not exists machine_equipment_id uuid null references public.machine_equipment_maintenances (id) on update cascade on delete set null;

comment on column public.labor_protection_requisitions.machine_equipment_id is '机器编号，关联机器设备维护';
comment on column public.tooling_stock_out.machine_equipment_id is '机器编号，关联机器设备维护';

create index if not exists idx_labor_protection_requisitions_machine_equipment_id
  on public.labor_protection_requisitions (machine_equipment_id);

create index if not exists idx_tooling_stock_out_machine_equipment_id
  on public.tooling_stock_out (machine_equipment_id);

drop policy if exists "Labor protection requisitions public insert" on public.labor_protection_requisitions;
create policy "Labor protection requisitions public insert" on public.labor_protection_requisitions
for insert to anon, authenticated with check (
  labor_protection_data_id is not null
  and machine_equipment_id is not null
  and btrim(job_title) <> ''
  and quantity > 0
  and btrim(recipient) <> ''
);

drop policy if exists "Machine equipment maintenances public select" on public.machine_equipment_maintenances;
create policy "Machine equipment maintenances public select" on public.machine_equipment_maintenances
for select to anon using (true);

drop policy if exists "Tooling data public select" on public.tooling_data;
create policy "Tooling data public select" on public.tooling_data
for select to anon using (true);

drop policy if exists "Tooling stock out public insert" on public.tooling_stock_out;
create policy "Tooling stock out public insert" on public.tooling_stock_out
for insert to anon with check (
  tooling_data_id is not null
  and machine_equipment_id is not null
  and btrim(tool_code) <> ''
  and btrim(tool_name) <> ''
  and btrim(tool_spec) <> ''
  and btrim(material) <> ''
  and btrim(recipient) <> ''
  and btrim(purpose) <> ''
  and unit_price >= 0
  and stock_out_quantity > 0
  and status = '待审核'
);
