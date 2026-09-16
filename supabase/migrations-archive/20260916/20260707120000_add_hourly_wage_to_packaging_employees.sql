do $$
begin
  if to_regclass('public.packaging_employees') is not null then
    alter table public.packaging_employees
    add column if not exists hourly_wage numeric(12, 2);

    update public.packaging_employees
    set hourly_wage = 19
    where hourly_wage is null;

    alter table public.packaging_employees
    alter column hourly_wage set default 19,
    alter column hourly_wage set not null;

    comment on column public.packaging_employees.hourly_wage is '时薪，单位：元/小时';
  end if;
end $$;
