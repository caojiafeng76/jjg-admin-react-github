
-- RPC: get_attendance_monthly_export
-- 返回指定年月的出勤明细（来自生产工单），用于Excel月度考勤表导出
-- 每行: 姓名, 岗位, 日期, 工时, 班别
CREATE OR REPLACE FUNCTION get_attendance_monthly_export(
  p_year  int,
  p_month int,
  p_name  text DEFAULT NULL
)
RETURNS TABLE (
  employee_name text,
  job_name      text,
  order_date    date,
  work_hours    numeric,
  shift         text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    e.name                        AS employee_name,
    COALESCE(e.job_name, '加工')  AS job_name,
    po.order_date::date           AS order_date,
    COALESCE(po.work_hours::numeric, 0) AS work_hours,
    COALESCE(po.shift, '白班')    AS shift
  FROM production_orders po
  JOIN employees e ON e.id = po.employee_id
  WHERE EXTRACT(YEAR  FROM po.order_date::date) = p_year
    AND EXTRACT(MONTH FROM po.order_date::date) = p_month
    AND (p_name IS NULL OR p_name = '' OR e.name ILIKE '%' || p_name || '%')
  ORDER BY e.name, po.order_date;
$$;
;
