-- 角色注册表：支持管理员动态新建自定义角色
-- 内置角色（admin/employee/team_leader/precision_cutting_admin）以 is_builtin=true 标记，禁止删除
-- role_permissions.role 已经是 text，无需修改；本表仅作为角色清单与展示元数据来源
CREATE TABLE IF NOT EXISTS public.roles (
  key text PRIMARY KEY,
  label text NOT NULL,
  description text,
  is_builtin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.roles IS '系统角色注册表，包含内置角色与管理员自定义角色。';
-- 内置角色种子（与 src/config/access.ts ROLE_LABELS 保持一致）
INSERT INTO public.roles (key, label, is_builtin)
VALUES ('admin', '管理员', true),
  ('employee', '员工', true),
  ('team_leader', '班组长', true),
  ('precision_cutting_admin', '精切管理员', true) ON CONFLICT (key) DO
UPDATE
SET label = EXCLUDED.label,
  is_builtin = true;
-- RLS：所有已认证用户可读；仅管理员可增改删；内置角色不可删/不可改 key
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles authenticated select" ON public.roles;
DROP POLICY IF EXISTS "roles admin insert" ON public.roles;
DROP POLICY IF EXISTS "roles admin update" ON public.roles;
DROP POLICY IF EXISTS "roles admin delete" ON public.roles;
CREATE POLICY "roles authenticated select" ON public.roles FOR
SELECT TO authenticated USING (true);
CREATE POLICY "roles admin insert" ON public.roles FOR
INSERT TO authenticated WITH CHECK (
    public.is_admin()
    AND is_builtin = false
  );
CREATE POLICY "roles admin update" ON public.roles FOR
UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "roles admin delete" ON public.roles FOR DELETE TO authenticated USING (
  public.is_admin()
  AND is_builtin = false
);
-- 防止内置角色被改 key 或被改成非内置
CREATE OR REPLACE FUNCTION public.protect_builtin_roles() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.is_builtin = true THEN IF NEW.key <> OLD.key THEN RAISE EXCEPTION '内置角色 key 不可修改';
END IF;
IF NEW.is_builtin = false THEN RAISE EXCEPTION '内置角色不可改为自定义';
END IF;
END IF;
RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_builtin_roles_trigger ON public.roles;
CREATE TRIGGER protect_builtin_roles_trigger BEFORE
UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.protect_builtin_roles();