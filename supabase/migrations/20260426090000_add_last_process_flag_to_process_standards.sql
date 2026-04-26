alter table public.process_standards
add column if not exists is_last_process boolean not null default false;
comment on column public.process_standards.is_last_process is '是否末道工序，默认 false';