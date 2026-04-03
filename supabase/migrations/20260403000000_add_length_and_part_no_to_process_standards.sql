alter table public.process_standards
add column if not exists length numeric(10, 2) not null default 0,
  add column if not exists part_no text;
comment on column public.process_standards.length is '长度，单位：mm，默认值 0';
comment on column public.process_standards.part_no is '料号，允许为空';