-- 1. 扩展 syney_safe_part_settings 为件号配置表
ALTER TABLE syney_safe_part_settings
  ADD COLUMN IF NOT EXISTS decomposition_role text NULL;

ALTER TABLE syney_safe_part_settings
  DROP CONSTRAINT IF EXISTS chk_decomposition_role;

ALTER TABLE syney_safe_part_settings
  ADD CONSTRAINT chk_decomposition_role CHECK (
    decomposition_role IS NULL OR decomposition_role IN (
      'side_frame',
      'cross_frame',
      'front_plate',
      'upper_middle',
      'lower_middle',
      'rear_upper',
      'rear_lower',
      'extension_upper',
      'extension_lower'
    )
  );

-- 2. 在 syney-pos 表新增围框垫材质字段
ALTER TABLE "syney-pos"
  ADD COLUMN IF NOT EXISTS "BorderMaterial" text NOT NULL DEFAULT '橡胶';

ALTER TABLE "syney-pos"
  DROP CONSTRAINT IF EXISTS chk_border_material;

ALTER TABLE "syney-pos"
  ADD CONSTRAINT chk_border_material CHECK (
    "BorderMaterial" IN ('橡胶', '尼龙')
  );;
