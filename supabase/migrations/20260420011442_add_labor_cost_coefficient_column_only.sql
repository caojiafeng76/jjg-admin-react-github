alter table public.process_standards
add column if not exists labor_cost_coefficient numeric(10, 4) not null default 1.0;
comment on column public.process_standards.labor_cost_coefficient is '人工成本系数，默认 1.0';