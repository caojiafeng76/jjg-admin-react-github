-- 当前 auth 用户是否拥有指定权限 key
-- 同时考虑 role_permissions 与 user_permission_overrides
CREATE OR REPLACE FUNCTION public.current_user_has_permission(p_key text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$ WITH me AS (
    SELECT e.id AS employee_id,
      e.role
    FROM public.employees e
    WHERE e.auth_user_id = auth.uid()
      AND e.is_active = true
    LIMIT 1
  ), perm AS (
    SELECT id
    FROM public.permissions
    WHERE key = p_key
    LIMIT 1
  )
SELECT EXISTS (
    -- 显式 override 为 true
    SELECT 1
    FROM public.user_permission_overrides upo
      JOIN me ON me.employee_id = upo.employee_id
      JOIN perm ON perm.id = upo.permission_id
    WHERE upo.enabled = true
  )
  OR EXISTS (
    -- 角色授权，且无 override 关闭
    SELECT 1
    FROM public.role_permissions rp
      JOIN me ON me.role = rp.role
      JOIN perm ON perm.id = rp.permission_id
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.user_permission_overrides upo2
        WHERE upo2.employee_id = me.employee_id
          AND upo2.permission_id = perm.id
          AND upo2.enabled = false
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.current_user_has_permission(text) TO anon,
  authenticated;