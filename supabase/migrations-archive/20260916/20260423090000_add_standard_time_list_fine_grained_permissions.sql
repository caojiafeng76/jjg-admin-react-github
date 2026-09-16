-- ============================================================
-- 第二步：成本核算（standard-time-list）精细权限
--
-- 新增 4 个 feature 权限 + 1 个 field 权限：
--   - feature:standard-time-list.create        新建按钮
--   - feature:standard-time-list.edit          编辑按钮
--   - feature:standard-time-list.delete        删除按钮
--   - feature:standard-time-list.export-cost   成本数据导出（敏感字段）
--   - field:standard-time-list.cost-detail.view 右侧成本明细面板可见性
--
-- 同步：src/features/workshop/permissions.ts、src/features/workshop/StandardTimeList/index.tsx
--
-- 注意：auto_grant_to_admin trigger 会在 INSERT 时自动给 admin 角色授权，
--       因此本 migration 不需要手动 INSERT role_permissions。
--       其他角色（team_leader / employee / general）默认无权限，
--       需要在权限管理 UI 中按需开启。
-- ============================================================
INSERT INTO public.permissions (key, scope, module, surface, label, description)
VALUES (
    'feature:standard-time-list.create',
    'feature',
    'standard-time-list',
    'pc',
    '成本核算-新建',
    '控制成本核算列表"添加"按钮入口'
  ),
  (
    'feature:standard-time-list.edit',
    'feature',
    'standard-time-list',
    'pc',
    '成本核算-编辑',
    '控制成本核算列表"编辑"按钮入口'
  ),
  (
    'feature:standard-time-list.delete',
    'feature',
    'standard-time-list',
    'pc',
    '成本核算-删除',
    '控制成本核算列表"删除"按钮入口'
  ),
  (
    'feature:standard-time-list.export-cost',
    'feature',
    'standard-time-list',
    'pc',
    '成本核算-导出成本数据',
    '控制"导出已选/按筛选条件导出"按钮（含敏感成本字段）'
  ),
  (
    'field:standard-time-list.cost-detail.view',
    'field',
    'standard-time-list',
    'pc',
    '成本核算-查看成本明细面板',
    '控制右侧成本明细 Splitter 面板的可见性（含人工/设备/总成本等敏感字段）'
  ) ON CONFLICT (key) DO NOTHING;