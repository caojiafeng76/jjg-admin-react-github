alter table public.process_standards
  add column if not exists tooling_fixture text null,
  add column if not exists clamping_count integer null,
  add column if not exists clamping_quantity numeric null,
  add column if not exists operator_count integer null,
  add column if not exists process_image_path text null,
  add column if not exists process_image_name text null,
  add column if not exists process_image_mime_type text null,
  add column if not exists process_image_size bigint null,
  add column if not exists process_image_uploaded_at timestamptz null,
  add column if not exists process_note text null;

comment on column public.process_standards.tooling_fixture is '工装治具';
comment on column public.process_standards.clamping_count is '装夹次数';
comment on column public.process_standards.clamping_quantity is '装夹数量，单位：支';
comment on column public.process_standards.operator_count is '人数';
comment on column public.process_standards.process_image_path is '工艺图示在 Supabase Storage process-standard-images bucket 中的路径';
comment on column public.process_standards.process_image_name is '工艺图示原始文件名';
comment on column public.process_standards.process_image_mime_type is '工艺图示 MIME 类型';
comment on column public.process_standards.process_image_size is '工艺图示文件大小，单位：字节';
comment on column public.process_standards.process_image_uploaded_at is '工艺图示上传或替换时间';
comment on column public.process_standards.process_note is '工艺说明';

do $$ begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_process_standards_clamping_count'
      and conrelid = 'public.process_standards'::regclass
  ) then
    alter table public.process_standards
      add constraint chk_process_standards_clamping_count
      check (clamping_count is null or clamping_count >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_process_standards_clamping_quantity'
      and conrelid = 'public.process_standards'::regclass
  ) then
    alter table public.process_standards
      add constraint chk_process_standards_clamping_quantity
      check (clamping_quantity is null or clamping_quantity >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_process_standards_operator_count'
      and conrelid = 'public.process_standards'::regclass
  ) then
    alter table public.process_standards
      add constraint chk_process_standards_operator_count
      check (operator_count is null or operator_count >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_process_standards_process_image_size'
      and conrelid = 'public.process_standards'::regclass
  ) then
    alter table public.process_standards
      add constraint chk_process_standards_process_image_size
      check (process_image_size is null or process_image_size >= 0);
  end if;
end $$;

insert into storage.buckets (id, name, public)
values ('process-standard-images', 'process-standard-images', false)
on conflict (id) do nothing;

update storage.buckets
set public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array ['image/png', 'image/jpeg', 'image/webp']
where id = 'process-standard-images';

do $$ begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Process standard images authenticated select'
  ) then
    execute 'create policy "Process standard images authenticated select"
      on storage.objects for select
      to authenticated
      using (bucket_id = ''process-standard-images'')';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Process standard images authenticated insert'
  ) then
    execute 'create policy "Process standard images authenticated insert"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = ''process-standard-images'')';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Process standard images authenticated update'
  ) then
    execute 'create policy "Process standard images authenticated update"
      on storage.objects for update
      to authenticated
      using (bucket_id = ''process-standard-images'')
      with check (bucket_id = ''process-standard-images'')';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Process standard images authenticated delete'
  ) then
    execute 'create policy "Process standard images authenticated delete"
      on storage.objects for delete
      to authenticated
      using (bucket_id = ''process-standard-images'')';
  end if;
end $$;
