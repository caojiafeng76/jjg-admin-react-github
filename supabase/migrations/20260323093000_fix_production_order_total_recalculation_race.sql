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
        coalesce(
          sum(
            coalesce(poi.qualified_hours, 0) + coalesce(poi.bonus_seconds, 0) / 3600.0 - coalesce(poi.defect_hours, 0)
          ),
          0
        )::numeric,
        2
      ) as total_qualified_hours
    from public.production_order_items as poi
    where poi.order_id = target_order_id
  ) as totals
where po.id = target_order_id;
end;
$$;
create or replace function public.update_production_order_totals() returns trigger language plpgsql as $$ begin if tg_op = 'UPDATE'
  and new.order_id is distinct
from old.order_id then perform public.recalculate_production_order_totals(old.order_id);
end if;
perform public.recalculate_production_order_totals(coalesce(new.order_id, old.order_id));
return coalesce(new, old);
end;
$$;
with order_totals as (
  select po.id,
    round(
      coalesce(
        sum(
          coalesce(poi.qualified_hours, 0) + coalesce(poi.bonus_seconds, 0) / 3600.0 - coalesce(poi.defect_hours, 0)
        ),
        0
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