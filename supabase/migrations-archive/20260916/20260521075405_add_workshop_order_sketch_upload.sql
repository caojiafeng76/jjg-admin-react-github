alter table public.sales_orders
add column if not exists sketch_file_path text null;

comment on column public.sales_orders.sketch_file_path is '订单简图在 Supabase Storage workshop-order-sketches bucket 中的路径';

insert into storage.buckets (id, name, public)
values (
    'workshop-order-sketches',
    'workshop-order-sketches',
    false
  ) on conflict (id) do nothing;

update storage.buckets
set public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array [
    'image/x-emf',
    'image/emf',
    'application/octet-stream',
    'image/png',
    'image/jpeg',
    'image/gif'
  ]
where id = 'workshop-order-sketches';

do $$ begin if not exists (
  select 1
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Workshop order sketches authenticated select'
) then execute '
      create policy "Workshop order sketches authenticated select"
      on storage.objects for select
      to authenticated
      using (bucket_id = ''workshop-order-sketches'')
    ';
end if;
if not exists (
  select 1
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Workshop order sketches authenticated insert'
) then execute '
      create policy "Workshop order sketches authenticated insert"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = ''workshop-order-sketches'')
    ';
end if;
if not exists (
  select 1
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Workshop order sketches authenticated update'
) then execute '
      create policy "Workshop order sketches authenticated update"
      on storage.objects for update
      to authenticated
      using (bucket_id = ''workshop-order-sketches'')
      with check (bucket_id = ''workshop-order-sketches'')
    ';
end if;
if not exists (
  select 1
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and policyname = 'Workshop order sketches authenticated delete'
) then execute '
      create policy "Workshop order sketches authenticated delete"
      on storage.objects for delete
      to authenticated
      using (bucket_id = ''workshop-order-sketches'')
    ';
end if;
end $$;
