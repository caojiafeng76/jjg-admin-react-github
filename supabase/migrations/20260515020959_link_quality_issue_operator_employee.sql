alter table public.quality_issue_records
add column if not exists operator_employee_id uuid references public.employees (id) on update cascade on delete restrict;

comment on column public.quality_issue_records.operator_employee_id is '操作人员工ID';

create index if not exists idx_quality_issue_records_operator_employee_id
on public.quality_issue_records (operator_employee_id);
