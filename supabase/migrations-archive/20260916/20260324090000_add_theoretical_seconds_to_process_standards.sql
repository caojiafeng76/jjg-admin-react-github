alter table public.process_standards
add column if not exists theoretical_seconds integer not null default 0;