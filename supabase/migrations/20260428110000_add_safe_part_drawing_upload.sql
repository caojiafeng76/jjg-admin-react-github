alter table public.syney_safe_part_settings
add column if not exists drawing_file_path text null,
  add column if not exists drawing_file_name text null,
  add column if not exists drawing_file_mime_type text null,
  add column if not exists drawing_file_size bigint null,
  add column if not exists drawing_uploaded_at timestamptz null;
comment on column public.syney_safe_part_settings.drawing_file_path is '件号图纸在 Supabase Storage syney-safe-part-drawings bucket 中的路径';
comment on column public.syney_safe_part_settings.drawing_file_name is '件号图纸原始文件名';
comment on column public.syney_safe_part_settings.drawing_file_mime_type is '件号图纸 MIME 类型';
comment on column public.syney_safe_part_settings.drawing_file_size is '件号图纸文件大小，单位字节';
comment on column public.syney_safe_part_settings.drawing_uploaded_at is '件号图纸上传或替换时间';
do $$ begin if not exists (
  select 1
  from pg_constraint
  where conname = 'chk_syney_safe_part_settings_drawing_file_size'
    and conrelid = 'public.syney_safe_part_settings'::regclass
) then execute '
      alter table public.syney_safe_part_settings
      add constraint chk_syney_safe_part_settings_drawing_file_size
      check (drawing_file_size is null or drawing_file_size >= 0)
    ';
end if;
end $$;
insert into storage.buckets (id, name, public)
values (
    'syney-safe-part-drawings',
    'syney-safe-part-drawings',
    false
  ) on conflict (id) do nothing;
update storage.buckets
set public = false,
  file_size_limit = 52428800,
  allowed_mime_types = array [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp'
  ]
where id = 'syney-safe-part-drawings';
do $$ begin if not exists (
  select 1
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Syney safe part drawings authenticated select'
) then execute '
      create policy "Syney safe part drawings authenticated select"
      on storage.objects for select
      to authenticated
      using (bucket_id = ''syney-safe-part-drawings'')
    ';
end if;
if not exists (
  select 1
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Syney safe part drawings authenticated insert'
) then execute '
      create policy "Syney safe part drawings authenticated insert"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = ''syney-safe-part-drawings'')
    ';
end if;
if not exists (
  select 1
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Syney safe part drawings authenticated update'
) then execute '
      create policy "Syney safe part drawings authenticated update"
      on storage.objects for update
      to authenticated
      using (bucket_id = ''syney-safe-part-drawings'')
      with check (bucket_id = ''syney-safe-part-drawings'')
    ';
end if;
if not exists (
  select 1
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Syney safe part drawings authenticated delete'
) then execute '
      create policy "Syney safe part drawings authenticated delete"
      on storage.objects for delete
      to authenticated
      using (bucket_id = ''syney-safe-part-drawings'')
    ';
end if;
end $$;