-- 移除 employees.role 的硬编码 CHECK 约束，改为引用 roles(key) 的外键
-- 让管理员在 roles 表中新建的自定义角色可以分配给员工
-- 删除有员工绑定的角色被 ON DELETE RESTRICT 阻止
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE public.employees
ADD CONSTRAINT employees_role_fkey FOREIGN KEY (role) REFERENCES public.roles(key) ON UPDATE CASCADE ON DELETE RESTRICT;