alter table public.production_order_items
add column if not exists outsource_defect_quantity integer not null default 0,
  add column if not exists outsource_defect_reason text,
  add column if not exists outsource_unit text,
  add column if not exists setup_defect_quantity integer not null default 0,
  add column if not exists setup_responsible text;
comment on column public.production_order_items.outsource_defect_quantity is '外协不良数';
comment on column public.production_order_items.outsource_defect_reason is '外协不良原因';
comment on column public.production_order_items.outsource_unit is '外协单位';
comment on column public.production_order_items.setup_defect_quantity is '调机不良数';
comment on column public.production_order_items.setup_responsible is '调机负责人';
alter table public.production_order_items drop column if exists defect_hours;
alter table public.production_order_items
add column defect_hours numeric generated always as (
    (
      case
        when defect_reason_1 = '加工' then (
          (defect_quantity_1 * 2)::numeric * standard_seconds
        )
        else 0::numeric
      end + case
        when defect_reason_2 = '加工' then (
          (defect_quantity_2 * 2)::numeric * standard_seconds
        )
        else 0::numeric
      end
    ) / 3600.0
  ) stored;
comment on column public.production_order_items.defect_hours is '仅加工/原料不良扣减的减分工时，外协不良与调机不良不扣工时';
create or replace function public.recalculate_production_order_totals(target_order_id uuid) returns void language plpgsql as $$ begin if target_order_id is null then return;
end if;
perform 1
from public.production_orders
where id = target_order_id for
update;
update public.production_orders as po
set total_qualified_hours = totals.total_qualified_hours,
  efficiency = case
    when coalesce(po.work_hours, 0) > 0 then totals.total_qualified_hours / po.work_hours
    else 0
  end,
  updated_at = now()
from (
    select round(
        (
          coalesce(
            sum(
              coalesce(poi.qualified_hours, 0) - coalesce(poi.defect_hours, 0)
            ),
            0
          ) + coalesce(max(base.extra_qualified_hours), 0)
        )::numeric,
        2
      ) as total_qualified_hours
    from public.production_orders as base
      left join public.production_order_items as poi on poi.order_id = base.id
    where base.id = target_order_id
    group by base.id
  ) as totals
where po.id = target_order_id;
end;
$$;
with order_totals as (
  select po.id,
    round(
      (
        coalesce(
          sum(
            coalesce(poi.qualified_hours, 0) - coalesce(poi.defect_hours, 0)
          ),
          0
        ) + coalesce(max(po.extra_qualified_hours), 0)
      )::numeric,
      2
    ) as total_qualified_hours
  from public.production_orders as po
    left join public.production_order_items as poi on poi.order_id = po.id
  group by po.id
)
update public.production_orders as po
set total_qualified_hours = order_totals.total_qualified_hours,
  efficiency = case
    when coalesce(po.work_hours, 0) > 0 then order_totals.total_qualified_hours / po.work_hours
    else 0
  end,
  updated_at = now()
from order_totals
where po.id = order_totals.id
  and (
    po.total_qualified_hours is distinct
    from order_totals.total_qualified_hours
      or po.efficiency is distinct
    from case
        when coalesce(po.work_hours, 0) > 0 then order_totals.total_qualified_hours / po.work_hours
        else 0
      end
  );