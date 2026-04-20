alter table public.process_standards
  alter column labor_cost drop expression if exists,
  alter column total_cost drop expression if exists;

create or replace function public.sync_process_standards_cost_fields()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from pg_attribute
    where attrelid = tg_relid
      and attname in ('labor_cost', 'total_cost')
      and attgenerated <> ''
  ) then
    return new;
  end if;

  new.labor_cost := (
    ((((coalesce(new.standard_seconds, 0))::numeric * coalesce(new.labor_rate, 0)) / 3600::numeric)
      * coalesce(new.labor_cost_coefficient, 1))::numeric(12, 4)
  );

  new.total_cost := (
    (
      ((((coalesce(new.standard_seconds, 0))::numeric * coalesce(new.labor_rate, 0)) / 3600::numeric)
        * coalesce(new.labor_cost_coefficient, 1))
      + (((coalesce(new.theoretical_seconds, 0))::numeric * coalesce(new.equipment_rate, 0)) / 3600::numeric)
      + (coalesce(new.tool_rate, 0) + coalesce(new.cutting_fluid_rate, 0) + coalesce(new.fixture_rate, 0))
      + (((coalesce(new.inspection_seconds, 0))::numeric * coalesce(new.labor_rate, 0)) / 3600::numeric)
      + case
          when coalesce(new.daily_total_hours, 0) > 0::numeric then
            (coalesce(new.daily_management_cost, 0) * (coalesce(new.standard_seconds, 0))::numeric)
            / (3600::numeric * coalesce(new.daily_total_hours, 0))
          else 0::numeric
        end
    )::numeric(12, 4)
  );

  return new;
end;
$$;

drop trigger if exists sync_process_standards_cost_fields on public.process_standards;
create trigger sync_process_standards_cost_fields
before insert or update on public.process_standards
for each row
execute function public.sync_process_standards_cost_fields();

comment on column public.process_standards.labor_cost is '人工成本，单位：元/支，已按人工成本系数折算';
comment on column public.process_standards.total_cost is '成本合计，单位：元/支，包含人工成本系数折算结果';