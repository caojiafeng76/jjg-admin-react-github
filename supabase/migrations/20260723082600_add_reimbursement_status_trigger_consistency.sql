create or replace function public.sync_invoice_archive_state()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.is_archived = new.reimbursement_status = '已报销';
  return new;
end;
$$;

drop trigger if exists sync_invoice_archive_state on public.invoices;
create trigger sync_invoice_archive_state
before insert or update on public.invoices
for each row execute function public.sync_invoice_archive_state();

select reimbursement_status, is_archived, count(*)
from public.invoices
group by reimbursement_status, is_archived
order by reimbursement_status, is_archived;;
