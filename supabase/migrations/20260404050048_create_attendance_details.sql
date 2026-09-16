-- 创建考勤明细表
CREATE TABLE IF NOT EXISTS attendance_details (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  date        date NOT NULL,
  time        time NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 基础 RLS
ALTER TABLE attendance_details ENABLE ROW LEVEL SECURITY;

-- admin 全权限策略
CREATE POLICY "admin_full_access_attendance_details"
  ON attendance_details
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
        AND employees.role = 'admin'
        AND employees.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.auth_user_id = auth.uid()
        AND employees.role = 'admin'
        AND employees.is_active = true
    )
  );

-- updated_at 自动更新触发器
CREATE OR REPLACE FUNCTION update_attendance_details_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_attendance_details_updated_at
  BEFORE UPDATE ON attendance_details
  FOR EACH ROW EXECUTE FUNCTION update_attendance_details_updated_at();

-- 索引
CREATE INDEX idx_attendance_details_date ON attendance_details (date DESC);
CREATE INDEX idx_attendance_details_name ON attendance_details (name);
;
