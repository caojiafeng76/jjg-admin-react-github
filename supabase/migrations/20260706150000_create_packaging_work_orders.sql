-- 包装车间生产工单表
create table if not exists public.packaging_work_orders (
  id uuid primary key default gen_random_uuid(),
  work_date date not null,
  employee_id uuid references public.packaging_employees (id) on update cascade on delete restrict,
  project_no text,
  product_model text not null,
  color_name text,
  process_name text,
  length_mm numeric,
  part_no text,
  unit text not null default '支',
  quantity numeric not null check (quantity >= 0),
  standard_seconds numeric not null default 0 check (standard_seconds >= 0),
  work_hours numeric generated always as (quantity * standard_seconds / 3600.0) stored,
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.packaging_work_orders is '包装车间生产工单';
comment on column public.packaging_work_orders.work_date is '工作日期';
comment on column public.packaging_work_orders.employee_id is '员工ID（关联packaging_employees）';
comment on column public.packaging_work_orders.project_no is '项目号（关联sales_orders）';
comment on column public.packaging_work_orders.product_model is '产品型号';
comment on column public.packaging_work_orders.color_name is '颜色';
comment on column public.packaging_work_orders.process_name is '工艺';
comment on column public.packaging_work_orders.length_mm is '长度(mm)';
comment on column public.packaging_work_orders.part_no is '料号';
comment on column public.packaging_work_orders.unit is '单位';
comment on column public.packaging_work_orders.quantity is '数量';
comment on column public.packaging_work_orders.standard_seconds is '标准工时(秒)';
comment on column public.packaging_work_orders.work_hours is '工时(小时)，自动计算 = 数量 × 标时 ÷ 3600';
comment on column public.packaging_work_orders.remark is '备注';

-- 索引
create index if not exists idx_packaging_work_orders_work_date_desc
  on public.packaging_work_orders (work_date desc);
create index if not exists idx_packaging_work_orders_employee_id
  on public.packaging_work_orders (employee_id);
create index if not exists idx_packaging_work_orders_project_no
  on public.packaging_work_orders (project_no) where project_no is not null;

-- 更新时间触发器
drop trigger if exists packaging_work_orders_set_updated_at on public.packaging_work_orders;
create trigger packaging_work_orders_set_updated_at
before update on public.packaging_work_orders
for each row
execute function public.update_updated_at_column();

-- RLS 策略
alter table public.packaging_work_orders enable row level security;

drop policy if exists "Packaging work orders admin all" on public.packaging_work_orders;
create policy "Packaging work orders admin all"
on public.packaging_work_orders
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "packaging_work_orders permission rw" on public.packaging_work_orders;
create policy "packaging_work_orders permission rw"
on public.packaging_work_orders
for all to authenticated
using (public.current_user_has_permission('page:packaging-process-work-order-list'))
with check (public.current_user_has_permission('page:packaging-process-work-order-list'));

-- 权限点
insert into public.permissions (key, scope, module, surface, label, description)
values
  (
    'page:packaging-process-work-order-list',
    'page',
    'packaging-process',
    'pc',
    '包装工序-生产工单',
    '控制包装生产工单页面访问及对应数据表 RLS'
  ),
  (
    'feature:packaging-process-work-order-list.create',
    'feature',
    'packaging-process',
    'pc',
    '包装工序生产工单-新建',
    '控制包装生产工单新建入口'
  ),
  (
    'feature:packaging-process-work-order-list.edit',
    'feature',
    'packaging-process',
    'pc',
    '包装工序生产工单-编辑',
    '控制包装生产工单编辑入口'
  ),
  (
    'feature:packaging-process-work-order-list.delete',
    'feature',
    'packaging-process',
    'pc',
    '包装工序生产工单-删除',
    '控制包装生产工单删除入口'
  ),
  (
    'feature:packaging-process-work-order-list.export',
    'feature',
    'packaging-process',
    'pc',
    '包装工序生产工单-导出',
    '控制包装生产工单导出入口'
  )
on conflict (key) do update
set
  scope = excluded.scope,
  module = excluded.module,
  surface = excluded.surface,
  label = excluded.label,
  description = excluded.description;
