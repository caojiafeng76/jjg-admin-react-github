alter table public.production_orders
add column if not exists shift text;

update public.production_orders
set shift = case
  when coalesce(remark, '') ~ '(晚班|夜班)' then '夜班'
  else '白班'
end
where shift is null;

alter table public.production_orders
alter column shift set default '白班';

update public.production_orders
set shift = '白班'
where shift is null;

alter table public.production_orders
alter column shift set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'production_orders_shift_check'
  ) then
    alter table public.production_orders
    add constraint production_orders_shift_check
    check (shift in ('白班', '夜班'));
  end if;
end $$;

comment on column public.production_orders.shift is '班别：白班 / 夜班';
