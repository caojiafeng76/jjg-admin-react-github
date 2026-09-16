alter table public.invoices
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.invoices
  alter column user_id set default auth.uid();

create index if not exists invoices_user_id_invoice_date_idx
  on public.invoices (user_id, invoice_date desc, created_at desc);

revoke all on public.invoices from anon;
grant select, insert, update, delete on public.invoices to authenticated;

drop policy if exists "Anonymous users can read invoices" on public.invoices;
drop policy if exists "Anonymous users can create invoices" on public.invoices;
drop policy if exists "Anonymous users can update invoices" on public.invoices;
drop policy if exists "Anonymous users can delete invoices" on public.invoices;
drop policy if exists "Authenticated users can read their invoices" on public.invoices;
create policy "Authenticated users can read their invoices"
  on public.invoices for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Authenticated users can create their invoices" on public.invoices;
create policy "Authenticated users can create their invoices"
  on public.invoices for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Authenticated users can update their invoices" on public.invoices;
create policy "Authenticated users can update their invoices"
  on public.invoices for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Authenticated users can delete their invoices" on public.invoices;
create policy "Authenticated users can delete their invoices"
  on public.invoices for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Anonymous users can upload invoice PDFs" on storage.objects;
drop policy if exists "Anonymous users can read invoice PDFs" on storage.objects;
drop policy if exists "Anonymous users can replace invoice PDFs" on storage.objects;
drop policy if exists "Anonymous users can delete invoice PDFs" on storage.objects;
drop policy if exists "Authenticated users can upload their invoice PDFs" on storage.objects;
create policy "Authenticated users can upload their invoice PDFs"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'invoice-pdfs'
    and exists (
      select 1 from public.invoices
      where invoices.id::text = (storage.foldername(name))[1]
        and invoices.user_id = (select auth.uid())
    )
  );
drop policy if exists "Authenticated users can read their invoice PDFs" on storage.objects;
create policy "Authenticated users can read their invoice PDFs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'invoice-pdfs'
    and exists (
      select 1 from public.invoices
      where invoices.id::text = (storage.foldername(name))[1]
        and invoices.user_id = (select auth.uid())
    )
  );
drop policy if exists "Authenticated users can replace their invoice PDFs" on storage.objects;
create policy "Authenticated users can replace their invoice PDFs"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'invoice-pdfs'
    and exists (
      select 1 from public.invoices
      where invoices.id::text = (storage.foldername(name))[1]
        and invoices.user_id = (select auth.uid())
    )
  )
  with check (bucket_id = 'invoice-pdfs');
drop policy if exists "Authenticated users can delete their invoice PDFs" on storage.objects;
create policy "Authenticated users can delete their invoice PDFs"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'invoice-pdfs'
    and exists (
      select 1 from public.invoices
      where invoices.id::text = (storage.foldername(name))[1]
        and invoices.user_id = (select auth.uid())
    )
  );;
