-- Create packaging_standard_times table
create table public.packaging_standard_times (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  length numeric not null default 0,
  part_no text,
  standard_seconds numeric not null default 0,
  remark text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.packaging_standard_times is '包装工序标准工时';

-- Enable RLS
alter table public.packaging_standard_times enable row level security;

-- Create RLS policy (admin only)
create policy "Packaging standard times admin all"
  on public.packaging_standard_times for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Create trigger for updated_at
create trigger update_packaging_standard_times_updated_at
  before update on public.packaging_standard_times
  for each row
  execute function update_updated_at_column();;
