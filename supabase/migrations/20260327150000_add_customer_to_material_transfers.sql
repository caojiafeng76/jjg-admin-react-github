alter table public.material_transfers
add column if not exists customer text;

comment on column public.material_transfers.customer is '客户快照';

create or replace function public.sync_material_transfer_customer_from_sales_orders()
returns trigger
language plpgsql
as $$
declare
  matched_customer text;
begin
  if new.project_no is null or btrim(new.project_no) = '' then
    new.customer = null;
    return new;
  end if;

  select so.customer
  into matched_customer
  from public.sales_orders so
  where so.project_no = new.project_no
  order by so.created_at desc nulls last, so.id desc
  limit 1;

  new.customer = matched_customer;

  return new;
end;
$$;

drop trigger if exists sync_material_transfer_customer_from_sales_orders on public.material_transfers;

create trigger sync_material_transfer_customer_from_sales_orders before
insert
  or update of project_no on public.material_transfers for each row
execute function public.sync_material_transfer_customer_from_sales_orders();