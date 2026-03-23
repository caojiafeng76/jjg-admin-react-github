alter table public.material_transfers
add column if not exists is_audited boolean not null default false,
  add column if not exists audited_at timestamptz;

comment on column public.material_transfers.is_audited is '物料转移单是否已审核';
comment on column public.material_transfers.audited_at is '物料转移单审核时间';

create or replace function public.sync_material_transfer_audit_fields() returns trigger language plpgsql as $$
begin
  if new.is_audited is true then
    if tg_op = 'INSERT' then
      new.audited_at = coalesce(new.audited_at, now());
    elsif old.is_audited is distinct from new.is_audited then
      new.audited_at = coalesce(new.audited_at, now());
    end if;
  else
    new.audited_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_material_transfer_audit_fields on public.material_transfers;

create trigger sync_material_transfer_audit_fields before
insert or update of is_audited, audited_at on public.material_transfers for each row
execute function public.sync_material_transfer_audit_fields();