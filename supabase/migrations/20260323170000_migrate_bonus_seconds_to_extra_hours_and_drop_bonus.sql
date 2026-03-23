with bonus_totals as (
  select
    order_id,
    round(coalesce(sum(coalesce(bonus_seconds, 0)) / 3600.0, 0)::numeric, 2) as bonus_hours
  from public.production_order_items
  group by order_id
)
update public.production_orders as po
set extra_qualified_hours = round(
    (coalesce(po.extra_qualified_hours, 0) + coalesce(bt.bonus_hours, 0))::numeric,
    2
  ),
  updated_at = now()
from bonus_totals as bt
where po.id = bt.order_id
  and coalesce(bt.bonus_hours, 0) > 0;

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
          coalesce(sum(coalesce(poi.qualified_hours, 0) - coalesce(poi.defect_hours, 0)), 0)
          + coalesce(max(base.extra_qualified_hours), 0)
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
        coalesce(sum(coalesce(poi.qualified_hours, 0) - coalesce(poi.defect_hours, 0)), 0)
        + coalesce(max(po.extra_qualified_hours), 0)
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
    po.total_qualified_hours is distinct from order_totals.total_qualified_hours
    or po.efficiency is distinct from case
      when coalesce(po.work_hours, 0) > 0 then order_totals.total_qualified_hours / po.work_hours
      else 0
    end
  );

alter table public.production_order_items
drop column if exists bonus_seconds;