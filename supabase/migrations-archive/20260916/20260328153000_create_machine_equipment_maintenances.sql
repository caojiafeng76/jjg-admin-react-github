create table if not exists public.machine_equipment_maintenances (
  id uuid primary key default gen_random_uuid(),
  unified_device_no text not null,
  operation text not null,
  machine_name text not null,
  original_no text,
  power_kw numeric(10, 2) not null default 0,
  sync_work_quantity integer not null default 1,
  electricity_unit_price numeric(10, 4) not null default 0,
  hourly_electricity_fee numeric(14, 8) generated always as (
    case
      when sync_work_quantity > 0 then (
        power_kw * electricity_unit_price / sync_work_quantity::numeric
      )::numeric(14, 8)
      else 0::numeric(14, 8)
    end
  ) stored,
  machine_value numeric(12, 2) not null default 0,
  depreciation_years integer not null default 1,
  annual_runtime_hours numeric(12, 2) not null default 1,
  depreciation_rate numeric(14, 8) generated always as (
    case
      when depreciation_years > 0
      and annual_runtime_hours > 0::numeric then (
        machine_value / depreciation_years::numeric / annual_runtime_hours
      )::numeric(14, 8)
      else 0::numeric(14, 8)
    end
  ) stored,
  equipment_hourly_rate numeric(14, 8) generated always as (
    (
      case
        when sync_work_quantity > 0 then (
          power_kw * electricity_unit_price / sync_work_quantity::numeric
        )::numeric(14, 8)
        else 0::numeric(14, 8)
      end
    ) + (
      case
        when depreciation_years > 0
        and annual_runtime_hours > 0::numeric then (
          machine_value / depreciation_years::numeric / annual_runtime_hours
        )::numeric(14, 8)
        else 0::numeric(14, 8)
      end
    )
  ) stored,
  remark text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint machine_equipment_maintenances_unified_device_no_not_blank check (btrim(unified_device_no) <> ''),
  constraint machine_equipment_maintenances_operation_not_blank check (btrim(operation) <> ''),
  constraint machine_equipment_maintenances_machine_name_not_blank check (btrim(machine_name) <> ''),
  constraint machine_equipment_maintenances_original_no_not_blank check (
    original_no is null
    or btrim(original_no) <> ''
  ),
  constraint machine_equipment_maintenances_power_kw_non_negative check (power_kw >= 0::numeric),
  constraint machine_equipment_maintenances_sync_work_quantity_positive check (sync_work_quantity > 0),
  constraint machine_equipment_maintenances_electricity_unit_price_non_negative check (electricity_unit_price >= 0::numeric),
  constraint machine_equipment_maintenances_machine_value_non_negative check (machine_value >= 0::numeric),
  constraint machine_equipment_maintenances_depreciation_years_positive check (depreciation_years > 0),
  constraint machine_equipment_maintenances_annual_runtime_hours_positive check (annual_runtime_hours > 0::numeric)
);
comment on table public.machine_equipment_maintenances is '机器设备维护';
comment on column public.machine_equipment_maintenances.unified_device_no is '统一设备编号';
comment on column public.machine_equipment_maintenances.operation is '工序';
comment on column public.machine_equipment_maintenances.machine_name is '机器名称';
comment on column public.machine_equipment_maintenances.original_no is '原编号';
comment on column public.machine_equipment_maintenances.power_kw is '功率，单位：kW';
comment on column public.machine_equipment_maintenances.sync_work_quantity is '同步工作数量';
comment on column public.machine_equipment_maintenances.electricity_unit_price is '电单价，单位：元/度';
comment on column public.machine_equipment_maintenances.hourly_electricity_fee is '单小时电费，按功率 × 电单价 ÷ 同步工作数量自动生成';
comment on column public.machine_equipment_maintenances.machine_value is '机器价值，单位：元';
comment on column public.machine_equipment_maintenances.depreciation_years is '折旧年份，单位：年';
comment on column public.machine_equipment_maintenances.annual_runtime_hours is '年运行时长，单位：小时';
comment on column public.machine_equipment_maintenances.depreciation_rate is '折旧费率，按机器价值 ÷ 折旧年份 ÷ 年运行时长自动生成';
comment on column public.machine_equipment_maintenances.equipment_hourly_rate is '设备小时费率，按单小时电费 + 折旧费率自动生成';
comment on column public.machine_equipment_maintenances.remark is '备注';
create unique index if not exists idx_machine_equipment_maintenances_unified_device_no_unique on public.machine_equipment_maintenances (unified_device_no);
create index if not exists idx_machine_equipment_maintenances_updated_at_desc on public.machine_equipment_maintenances (updated_at desc);
create index if not exists idx_machine_equipment_maintenances_operation on public.machine_equipment_maintenances (operation);
create index if not exists idx_machine_equipment_maintenances_machine_name on public.machine_equipment_maintenances (machine_name);
drop trigger if exists update_machine_equipment_maintenances_updated_at on public.machine_equipment_maintenances;
create trigger update_machine_equipment_maintenances_updated_at before
update on public.machine_equipment_maintenances for each row execute function public.update_updated_at_column();
alter table public.machine_equipment_maintenances enable row level security;
drop policy if exists "Machine equipment maintenances admin all" on public.machine_equipment_maintenances;
create policy "Machine equipment maintenances admin all" on public.machine_equipment_maintenances for all to authenticated using (public.is_admin()) with check (public.is_admin());