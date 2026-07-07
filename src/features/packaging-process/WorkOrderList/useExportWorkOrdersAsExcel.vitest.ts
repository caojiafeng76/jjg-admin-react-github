import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { PackagingWorkOrder } from '@/services/apiPackagingWorkOrders'
import { buildWorkbook } from './useExportWorkOrdersAsExcel'

describe('buildWorkbook', () => {
  it('adds salary rows using total hours, hourly wage, and position salary', () => {
    const buffer = buildWorkbook([
      {
        id: 'order-1',
        work_date: '2026-07-01',
        employee_id: 'employee-1',
        employee_name: '张三',
        employee_hourly_wage: 20,
        employee_position_salary: 100,
        project_no: 'P-1',
        product_model: 'M-1',
        color_name: null,
        process_name: null,
        length_mm: null,
        part_no: null,
        unit: '支',
        quantity: 10,
        standard_seconds: 360,
        work_hours: 1,
        extra_qualified_hours: 0.5,
        remark: null,
        created_at: '2026-07-01T00:00:00Z',
        updated_at: '2026-07-01T00:00:00Z',
      },
      {
        id: 'order-2',
        work_date: '2026-07-02',
        employee_id: 'employee-1',
        employee_name: '张三',
        employee_hourly_wage: 20,
        employee_position_salary: 100,
        project_no: 'P-2',
        product_model: 'M-2',
        color_name: null,
        process_name: null,
        length_mm: null,
        part_no: null,
        unit: '支',
        quantity: 5,
        standard_seconds: 720,
        work_hours: 1,
        extra_qualified_hours: 0,
        remark: null,
        created_at: '2026-07-02T00:00:00Z',
        updated_at: '2026-07-02T00:00:00Z',
      },
    ] as PackagingWorkOrder[])

    const workbook = XLSX.read(buffer, { type: 'array' })
    const worksheet = workbook.Sheets['工时工资表']
    const rows = XLSX.utils.sheet_to_json<Array<string | number>>(worksheet, {
      header: 1,
    })

    expect(rows).toContainEqual(['合计', '2.50', '2.50'])
    expect(rows).toContainEqual(['时薪', '20.00', ''])
    expect(rows).toContainEqual(['岗位工资', '100.00', '100.00'])
    expect(rows).toContainEqual(['工资', '150.00', '150.00'])
  })
})
