alter table public.process_standards
add column if not exists labor_cost_coefficient numeric(10, 4) not null default 1.0;
alter table public.process_standards drop column if exists total_cost,
  drop column if exists labor_cost;
alter table public.process_standards
add column labor_cost numeric(12, 4) generated always as (
    (
      (
        (
          ((standard_seconds)::numeric * labor_rate) / 3600::numeric
        ) * labor_cost_coefficient
      )
    )::numeric(12, 4)
  ) stored,
  add column total_cost numeric(12, 4) generated always as (
    (
      (
        (
          ((standard_seconds)::numeric * labor_rate) / 3600::numeric
        ) * labor_cost_coefficient
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
comment on column public.process_standards.labor_cost_coefficient is '人工成本系数，默认 1.0';
comment on column public.process_standards.labor_cost is '人工成本，单位：元/支，已按人工成本系数折算';
comment on column public.process_standards.total_cost is '成本合计，单位：元/支';