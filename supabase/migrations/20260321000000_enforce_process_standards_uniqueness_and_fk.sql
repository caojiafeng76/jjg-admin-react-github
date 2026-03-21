-- 清理 process_standards 重复数据，保留每组最新一条记录
with ranked_process_standards as (
  select id,
    row_number() over (
      partition by model,
      operation
      order by updated_at desc nulls last,
        created_at desc nulls last,
        id desc
    ) as row_num
  from public.process_standards
)
delete from public.process_standards ps using ranked_process_standards ranked
where ps.id = ranked.id
  and ranked.row_num > 1;
alter table public.process_standards
add constraint process_standards_model_operation_key unique (model, operation);
create index if not exists idx_production_order_items_product_model_operation on public.production_order_items (product_model, operation);
alter table public.production_order_items
add constraint production_order_items_product_model_operation_fkey foreign key (product_model, operation) references public.process_standards (model, operation) on update cascade on delete restrict not valid;
alter table public.production_order_items validate constraint production_order_items_product_model_operation_fkey;