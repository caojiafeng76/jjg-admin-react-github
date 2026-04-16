create table if not exists public.labor_protection_data (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint labor_protection_data_category_not_blank check (btrim(category) <> '')
);
comment on table public.labor_protection_data is '劳保资料';
comment on column public.labor_protection_data.category is '种类';
create unique index if not exists idx_labor_protection_data_category_unique on public.labor_protection_data (category);
create index if not exists idx_labor_protection_data_updated_at_desc on public.labor_protection_data (updated_at desc);
drop trigger if exists update_labor_protection_data_updated_at on public.labor_protection_data;
create trigger update_labor_protection_data_updated_at before
update on public.labor_protection_data for each row execute function public.update_updated_at_column();
alter table public.labor_protection_data enable row level security;
drop policy if exists "Labor protection data admin all" on public.labor_protection_data;
create policy "Labor protection data admin all" on public.labor_protection_data for all to authenticated using (public.is_admin()) with check (public.is_admin());