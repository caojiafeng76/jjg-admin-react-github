alter table public.quality_rework_repairs
add column if not exists project_no text;
alter table public.quality_rework_repairs drop constraint if exists quality_rework_repairs_project_no_not_blank;
alter table public.quality_rework_repairs
add constraint quality_rework_repairs_project_no_not_blank check (
    project_no is null
    or btrim(project_no) <> ''
  );
comment on column public.quality_rework_repairs.project_no is '关联订单项目号';
create index if not exists idx_quality_rework_repairs_project_no on public.quality_rework_repairs (project_no)
where project_no is not null;
create table if not exists public.quality_rework_repair_document_sequences (
  document_date date primary key,
  last_sequence integer not null default 0,
  updated_at timestamp with time zone not null default now(),
  constraint quality_rework_repair_document_sequences_non_negative check (last_sequence >= 0)
);
comment on table public.quality_rework_repair_document_sequences is '质量返工返修编号每日顺序号';
comment on column public.quality_rework_repair_document_sequences.document_date is '编号日期';
comment on column public.quality_rework_repair_document_sequences.last_sequence is '当天已分配的最大顺序号';
alter table public.quality_rework_repair_document_sequences enable row level security;
insert into public.quality_rework_repair_document_sequences (document_date, last_sequence)
select to_date(
    substring(
      document_no
      from 1 for 8
    ),
    'YYYYMMDD'
  ) as document_date,
  max(
    substring(
      document_no
      from 9
    )::integer
  ) as last_sequence
from public.quality_rework_repairs
where document_no ~ '^\d{11}$'
group by to_date(
    substring(
      document_no
      from 1 for 8
    ),
    'YYYYMMDD'
  ) on conflict (document_date) do
update
set last_sequence = greatest(
    public.quality_rework_repair_document_sequences.last_sequence,
    excluded.last_sequence
  ),
  updated_at = now();
create or replace function public.next_quality_rework_repair_document_no(p_document_date date default null) returns text language plpgsql security definer
set search_path = public as $$
declare v_document_date date := coalesce(
    p_document_date,
    timezone('Asia/Shanghai', now())::date
  );
v_sequence integer;
begin if coalesce(auth.role(), '') in ('anon', 'authenticated')
and not public.current_user_has_permission('page:quality-rework-repair') then raise exception '没有返工返修权限，无法生成编号' using errcode = '42501';
end if;
insert into public.quality_rework_repair_document_sequences (document_date, last_sequence)
values (v_document_date, 1) on conflict (document_date) do
update
set last_sequence = public.quality_rework_repair_document_sequences.last_sequence + 1,
  updated_at = now()
returning last_sequence into v_sequence;
return to_char(v_document_date, 'YYYYMMDD') || lpad(v_sequence::text, 3, '0');
end;
$$;
revoke all on function public.next_quality_rework_repair_document_no(date)
from public;
grant execute on function public.next_quality_rework_repair_document_no(date) to authenticated;
create or replace function public.assign_quality_rework_repair_document_no() returns trigger language plpgsql security definer
set search_path = public as $$ begin if nullif(btrim(new.document_no), '') is null then new.document_no := public.next_quality_rework_repair_document_no();
else new.document_no := btrim(new.document_no);
end if;
return new;
end;
$$;
drop trigger if exists assign_quality_rework_repair_document_no on public.quality_rework_repairs;
create trigger assign_quality_rework_repair_document_no before
insert on public.quality_rework_repairs for each row execute function public.assign_quality_rework_repair_document_no();