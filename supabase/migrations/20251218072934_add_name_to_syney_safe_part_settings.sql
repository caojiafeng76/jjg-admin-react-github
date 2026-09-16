alter table public.syney_safe_part_settings
  add column if not exists name text;

comment on column public.syney_safe_part_settings.name is '名称: 梳齿支撑板 / 楼层板';
;
