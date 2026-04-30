-- 强制 viewer（查看员/查看组）为只读角色
-- 1. 移除 viewer 的操作类权限和权限管理入口
-- 2. 清理查看员成员被单独授予的操作类用户覆盖
-- 3. 在 public 表上加 DML 防护触发器，防止 viewer 通过接口绕过前端按钮限制
CREATE OR REPLACE FUNCTION public.current_user_is_viewer() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public' AS $function$
SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.auth_user_id = auth.uid()
      AND e.role = 'viewer'
      AND e.is_active = true
  ) $function$;
CREATE OR REPLACE FUNCTION public.prevent_viewer_dml() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $function$ BEGIN IF public.current_user_is_viewer() THEN RAISE EXCEPTION '查看员仅可查看数据，不能执行新增、编辑、删除、导入、导出或权限调整操作' USING ERRCODE = '42501';
END IF;
IF TG_OP = 'DELETE' THEN RETURN OLD;
END IF;
RETURN NEW;
END;
$function$;
DELETE FROM public.role_permissions rp USING public.permissions p
WHERE rp.permission_id = p.id
  AND rp.role = 'viewer'
  AND (
    p.scope IN ('feature', 'field')
    OR p.key IN (
      'nav:access-management',
      'page:access-management'
    )
  );
DELETE FROM public.user_permission_overrides upo USING public.permissions p,
  public.employees e
WHERE upo.permission_id = p.id
  AND upo.employee_id = e.id
  AND e.role = 'viewer'
  AND upo.enabled = true
  AND (
    p.scope IN ('feature', 'field')
    OR p.key IN (
      'nav:access-management',
      'page:access-management'
    )
  );
UPDATE public.roles
SET description = '仅可查看已授权数据，无新增、编辑、删除、导入、导出或权限调整权限'
WHERE key = 'viewer';
DO $do$
DECLARE target_table record;
BEGIN FOR target_table IN
SELECT n.nspname AS schema_name,
  c.relname AS table_name
FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r' LOOP EXECUTE format(
    'DROP TRIGGER IF EXISTS prevent_viewer_dml_trigger ON %I.%I',
    target_table.schema_name,
    target_table.table_name
  );
EXECUTE format(
  'CREATE TRIGGER prevent_viewer_dml_trigger BEFORE INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.prevent_viewer_dml()',
  target_table.schema_name,
  target_table.table_name
);
END LOOP;
END $do$;