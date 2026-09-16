
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_date date not null,
  invoice_number text not null,
  currency text not null check (currency in ('CNY', 'USD')),
  amount_original numeric(14, 2) not null check (amount_original > 0),
  exchange_rate numeric(12, 6) not null check (exchange_rate > 0),
  amount_cny numeric(14, 2) generated always as (
    round(amount_original * exchange_rate, 2)
  ) stored,
  purpose text not null check (btrim(purpose) <> ''),
  notes text,
  pdf_path text,
  pdf_name text,
  pdf_size integer check (pdf_size is null or pdf_size > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_cny_exchange_rate check (currency <> 'CNY' or exchange_rate = 1),
  constraint invoices_pdf_metadata check (
    (pdf_path is null and pdf_name is null and pdf_size is null)
    or (pdf_path is not null and pdf_name is not null and pdf_size is not null)
  )
);

create unique index if not exists invoices_invoice_number_unique
  on public.invoices (invoice_number);

create index if not exists invoices_invoice_date_created_at_idx
  on public.invoices (invoice_date desc, created_at desc);

create or replace function public.set_invoices_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row execute function public.set_invoices_updated_at();

grant select, insert, update, delete on public.invoices to anon;

alter table public.invoices enable row level security;

drop policy if exists "Anonymous users can read invoices" on public.invoices;
create policy "Anonymous users can read invoices"
on public.invoices for select to anon using (true);

drop policy if exists "Anonymous users can create invoices" on public.invoices;
create policy "Anonymous users can create invoices"
on public.invoices for insert to anon with check (true);

drop policy if exists "Anonymous users can update invoices" on public.invoices;
create policy "Anonymous users can update invoices"
on public.invoices for update to anon using (true) with check (true);

drop policy if exists "Anonymous users can delete invoices" on public.invoices;
create policy "Anonymous users can delete invoices"
on public.invoices for delete to anon using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoice-pdfs', 'invoice-pdfs', false, 10485760, array['application/pdf']::text[])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anonymous users can upload invoice PDFs" on storage.objects;
create policy "Anonymous users can upload invoice PDFs"
on storage.objects for insert to anon
with check (bucket_id = 'invoice-pdfs');

drop policy if exists "Anonymous users can read invoice PDFs" on storage.objects;
create policy "Anonymous users can read invoice PDFs"
on storage.objects for select to anon
using (bucket_id = 'invoice-pdfs');

drop policy if exists "Anonymous users can replace invoice PDFs" on storage.objects;
create policy "Anonymous users can replace invoice PDFs"
on storage.objects for update to anon
using (bucket_id = 'invoice-pdfs')
with check (bucket_id = 'invoice-pdfs');

drop policy if exists "Anonymous users can delete invoice PDFs" on storage.objects;
create policy "Anonymous users can delete invoice PDFs"
on storage.objects for delete to anon
using (bucket_id = 'invoice-pdfs');
;
