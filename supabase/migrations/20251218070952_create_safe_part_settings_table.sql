create table if not exists public.syney_safe_part_settings (
  id uuid primary key default gen_random_uuid(),
  part_no text not null unique,
  need_print_label boolean not null default true,
  is_safe_part boolean not null default true,
  remark text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.syney_safe_part_settings enable row level security;

create policy "Enable read for authenticated" on public.syney_safe_part_settings
  for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated" on public.syney_safe_part_settings
  for insert
  to authenticated
  with check (true);

create policy "Enable update for authenticated" on public.syney_safe_part_settings
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Enable delete for authenticated" on public.syney_safe_part_settings
  for delete
  to authenticated
  using (true);
;
