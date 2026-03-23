alter table public.production_orders
add column if not exists extra_qualified_hours numeric(10, 2) not null default 0;

comment on column public.production_orders.extra_qualified_hours is '生产工单零工工时（小时）';

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
              coalesce(poi.qualified_hours, 0) + coalesce(poi.bonus_seconds, 0) / 3600.0 - coalesce(poi.defect_hours, 0)
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

create or replace function public.refresh_production_order_totals_for_order() returns trigger language plpgsql as $$ begin perform public.recalculate_production_order_totals(new.id);
return new;
end;
$$;

drop trigger if exists recalculate_production_order_totals_on_order_change on public.production_orders;
create trigger recalculate_production_order_totals_on_order_change
after insert or update of work_hours, extra_qualified_hours on public.production_orders
for each row
execute function public.refresh_production_order_totals_for_order();

with order_totals as (
  select po.id,
    round(
      (
        coalesce(
          sum(
            coalesce(poi.qualified_hours, 0) + coalesce(poi.bonus_seconds, 0) / 3600.0 - coalesce(poi.defect_hours, 0)
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