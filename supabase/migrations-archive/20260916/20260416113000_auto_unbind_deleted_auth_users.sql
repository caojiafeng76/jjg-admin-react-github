create or replace function public.unbind_employee_when_auth_user_deleted() returns trigger language plpgsql security definer
set search_path = public,
  auth as $$ begin
update public.employees
set auth_user_id = null,
  updated_at = now()
where auth_user_id = old.id;
return old;
end;
$$;
comment on function public.unbind_employee_when_auth_user_deleted() is '当 auth.users 中的账号被删除时，自动清理 employees.auth_user_id 绑定';
drop trigger if exists unbind_employee_when_auth_user_deleted on auth.users;
create trigger unbind_employee_when_auth_user_deleted
after delete on auth.users for each row execute function public.unbind_employee_when_auth_user_deleted();
update public.employees as e
set auth_user_id = null,
  updated_at = now()
where e.auth_user_id is not null
  and not exists (
    select 1
    from auth.users as au
    where au.id = e.auth_user_id
  );