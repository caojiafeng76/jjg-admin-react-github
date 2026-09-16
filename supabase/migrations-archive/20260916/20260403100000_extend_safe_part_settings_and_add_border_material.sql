-- ============================================================
-- 1. 扩展 syney_safe_part_settings 为件号配置表
--    新增 decomposition_role 字段，标识该件号在分解单中的列位置
-- ============================================================
ALTER TABLE syney_safe_part_settings
ADD COLUMN IF NOT EXISTS decomposition_role text NULL;
COMMENT ON COLUMN syney_safe_part_settings.decomposition_role IS '分解单列映射角色。取值：side_frame（侧围）、cross_frame（横围）、' 'front_plate（前板）、upper_middle（上中板）、lower_middle（下中板）、' 'rear_upper（上后板）、rear_lower（下后板）、' 'extension_upper（上加长板）、extension_lower（下加长板）';
-- 可选约束：防止录入非法值（如需放开直接 DROP 此约束）
ALTER TABLE syney_safe_part_settings DROP CONSTRAINT IF EXISTS chk_decomposition_role;
ALTER TABLE syney_safe_part_settings
ADD CONSTRAINT chk_decomposition_role CHECK (
    decomposition_role IS NULL
    OR decomposition_role IN (
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
-- ============================================================
-- 2. 在 syney-pos 表新增围框垫材质字段
--    默认橡胶，可选橡胶 / 尼龙
-- ============================================================
ALTER TABLE "syney-pos"
ADD COLUMN IF NOT EXISTS "BorderMaterial" text NOT NULL DEFAULT '橡胶';
COMMENT ON COLUMN "syney-pos"."BorderMaterial" IS '围框垫材质。取值：橡胶（默认）、尼龙';
ALTER TABLE "syney-pos" DROP CONSTRAINT IF EXISTS chk_border_material;
ALTER TABLE "syney-pos"
ADD CONSTRAINT chk_border_material CHECK ("BorderMaterial" IN ('橡胶', '尼龙'));