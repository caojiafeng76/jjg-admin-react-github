-- 移除写死的 role check 约束，改为外键引用 roles(key)
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_role_fkey
  FOREIGN KEY (role) REFERENCES public.roles(key)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;;
