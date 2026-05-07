-- 订单排产：班组人员关联员工表，支持多选
alter table public.sales_orders
  add column if not exists responsible_person_ids text[] default '{}'::text[],
  add column if not exists responsible_person_names text[] default '{}'::text[];

comment on column public.sales_orders.responsible_person_ids is '订单排产：负责班组人员ID列表，引用 employees.id';
comment on column public.sales_orders.responsible_person_names is '订单排产：负责班组人员姓名列表，冗余展示用';
