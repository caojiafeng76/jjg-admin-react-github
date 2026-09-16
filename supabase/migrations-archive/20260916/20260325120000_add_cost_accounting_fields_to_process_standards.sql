alter table public.process_standards
add column if not exists labor_rate numeric(10, 4) not null default 0,
  add column if not exists equipment_rate numeric(10, 4) not null default 0,
  add column if not exists tool_rate numeric(10, 4) not null default 0,
  add column if not exists cutting_fluid_rate numeric(10, 4) not null default 0,
  add column if not exists fixture_rate numeric(10, 4) not null default 0,
  add column if not exists inspection_seconds integer not null default 0,
  add column if not exists daily_management_cost numeric(12, 2) not null default 0,
  add column if not exists daily_total_hours numeric(10, 2) not null default 0,
  add column if not exists remark text;
alter table public.process_standards
add column if not exists labor_cost numeric(12, 4) generated always as (
    (
      ((standard_seconds)::numeric * labor_rate) / 3600::numeric
    )::numeric(12, 4)
  ) stored,
  add column if not exists equipment_cost numeric(12, 4) generated always as (
    (
      ((theoretical_seconds)::numeric * equipment_rate) / 3600::numeric
    )::numeric(12, 4)
  ) stored,
  add column if not exists tooling_consumable_cost numeric(12, 4) generated always as (
    (tool_rate + cutting_fluid_rate + fixture_rate)::numeric(12, 4)
  ) stored,
  add column if not exists inspection_cost numeric(12, 4) generated always as (
    (
      ((inspection_seconds)::numeric * labor_rate) / 3600::numeric
    )::numeric(12, 4)
  ) stored,
  add column if not exists overhead_cost numeric(12, 4) generated always as (
    case
      when daily_total_hours > 0::numeric then (
        (
          (
            daily_management_cost * (standard_seconds)::numeric
          ) / (3600::numeric * daily_total_hours)
        )::numeric(12, 4)
      )
      else 0::numeric(12, 4)
    end
  ) stored,
  add column if not exists total_cost numeric(12, 4) generated always as (
    (
      (
        ((standard_seconds)::numeric * labor_rate) / 3600::numeric
      ) + (
        ((theoretical_seconds)::numeric * equipment_rate) / 3600::numeric
      ) + (tool_rate + cutting_fluid_rate + fixture_rate) + (
        ((inspection_seconds)::numeric * labor_rate) / 3600::numeric
      ) + case
        when daily_total_hours > 0::numeric then (
          (
            daily_management_cost * (standard_seconds)::numeric
          ) / (3600::numeric * daily_total_hours)
        )
        else 0::numeric
      end
    )::numeric(12, 4)
  ) stored;
comment on column public.process_standards.labor_rate is '人工费率，单位：元/小时';
comment on column public.process_standards.equipment_rate is '设备费率，单位：元/小时';
comment on column public.process_standards.tool_rate is '刀具费率，单位：元/支';
comment on column public.process_standards.cutting_fluid_rate is '切削液费率，单位：元/支';
comment on column public.process_standards.fixture_rate is '工装费率，单位：元/支';
comment on column public.process_standards.inspection_seconds is '检验工时，单位：秒';
comment on column public.process_standards.daily_management_cost is '日管理总费用，单位：元';
comment on column public.process_standards.daily_total_hours is '日总工时，单位：小时';
comment on column public.process_standards.remark is '成本核算备注';
comment on column public.process_standards.labor_cost is '人工成本，单位：元/支';
comment on column public.process_standards.equipment_cost is '设备成本，单位：元/支';
comment on column public.process_standards.tooling_consumable_cost is '刀具辅料成本合计，单位：元/支';
comment on column public.process_standards.inspection_cost is '检验成本，单位：元/支';
comment on column public.process_standards.overhead_cost is '单品分摊额，单位：元/支';
comment on column public.process_standards.total_cost is '成本合计，单位：元/支';