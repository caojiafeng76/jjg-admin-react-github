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
        color_name: '喷涂',
        process_name: null,
        length_mm: 1000,
        part_no: null,
        weight_per_meter_kg: 1.2,
        unit: '支',
        quantity: 10,
        defective_quantity: 1.4,
        defective_weight_kg: 0,
        defect_reason: null,
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
        weight_per_meter_kg: 1.2,
        unit: '支',
        quantity: 5.4,
        defective_quantity: 0,
        defective_weight_kg: 0,
        defect_reason: null,
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

  it('adds daily report sheet and keeps defect fields out of detail sheet', () => {
    const buffer = buildWorkbook([
      {
        id: 'order-1',
        work_date: '2026-06-01',
        employee_id: 'employee-1',
        employee_name: '张三',
        employee_hourly_wage: 20,
        employee_position_salary: 100,
        project_no: 'P-1',
        product_model: 'M-1',
        color_name: '喷涂',
        process_name: null,
        length_mm: 1000,
        part_no: null,
        weight_per_meter_kg: 1.2,
        unit: '支',
        quantity: 10,
        defective_quantity: 1,
        defective_weight_kg: 1.2,
        defect_reason: '划伤\n变形',
        standard_seconds: 360,
        work_hours: 1,
        extra_qualified_hours: 0,
        remark: null,
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
      },
      {
        id: 'order-2',
        work_date: '2026-06-01',
        employee_id: 'employee-2',
        employee_name: '李四',
        employee_hourly_wage: 20,
        employee_position_salary: 100,
        project_no: 'P-1',
        product_model: 'M-1',
        color_name: '喷涂',
        process_name: null,
        length_mm: 1000,
        part_no: null,
        weight_per_meter_kg: 1.2,
        unit: '支',
        quantity: 5,
        defective_quantity: 0,
        defective_weight_kg: 0,
        defect_reason: '划伤\n变形',
        standard_seconds: 360,
        work_hours: 0.5,
        extra_qualified_hours: 0,
        remark: null,
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
      },
    ] as PackagingWorkOrder[])

    const workbook = XLSX.read(buffer, { type: 'array' })
    expect(workbook.SheetNames).toContain('生产日报表')

    const detailRows = XLSX.utils.sheet_to_json<Array<string | number>>(
      workbook.Sheets['产量清单'],
      { header: 1 },
    )
    expect(detailRows[1]).not.toContain('不良数量')
    expect(detailRows[1]).not.toContain('不良重量(kg)')
    expect(detailRows[1]).not.toContain('不良原因')

    const dailyRows = XLSX.utils.sheet_to_json<Array<string | number>>(
      workbook.Sheets['生产日报表'],
      { header: 1 },
    )
    expect(dailyRows[1]).toEqual([
      '日期',
      '班组',
      '型号',
      '项目号',
      '长度（MM)',
      '包装数量',
      '单位',
      '表面处理',
      '米重',
      '合格重量',
      '不良数',
      '不良重量',
      '不良原因',
      '',
      '电梯料',
    ])
    expect(dailyRows[2]).toEqual([
      '6.1',
      '张三、李四',
      'M-1',
      'P-1',
      1000,
      15,
      '支',
      '喷涂',
      1.2,
      18,
      1,
      1.2,
      '划伤\n变形',
      '',
      '',
    ])
  })

  it('shows elevator quantity and adds daily report totals', () => {
    const buffer = buildWorkbook([
      {
        id: 'order-1',
        work_date: '2026-07-08',
        employee_id: 'employee-1',
        employee_name: '李自芬',
        employee_hourly_wage: 20,
        employee_position_salary: 100,
        project_no: null,
        product_model: '电梯料',
        color_name: '喷涂',
        process_name: null,
        length_mm: null,
        part_no: null,
        weight_per_meter_kg: 0,
        unit: '支',
        quantity: 300,
        defective_quantity: 0,
        defective_weight_kg: 0,
        defect_reason: null,
        standard_seconds: 360,
        work_hours: 1,
        extra_qualified_hours: 0,
        remark: null,
        created_at: '2026-07-08T00:00:00Z',
        updated_at: '2026-07-08T00:00:00Z',
      },
      {
        id: 'order-2',
        work_date: '2026-07-08',
        employee_id: 'employee-2',
        employee_name: '应采妹',
        employee_hourly_wage: 20,
        employee_position_salary: 100,
        project_no: 'P-2',
        product_model: 'M-2',
        color_name: '氧化',
        process_name: null,
        length_mm: 1000,
        part_no: null,
        weight_per_meter_kg: 1.5,
        unit: '支',
        quantity: 10,
        defective_quantity: 2,
        defective_weight_kg: 3,
        defect_reason: '划伤',
        standard_seconds: 360,
        work_hours: 1,
        extra_qualified_hours: 0,
        remark: null,
        created_at: '2026-07-08T00:00:00Z',
        updated_at: '2026-07-08T00:00:00Z',
      },
    ] as PackagingWorkOrder[])

    const workbook = XLSX.read(buffer, { type: 'array' })
    const dailyRows = XLSX.utils.sheet_to_json<Array<string | number>>(
      workbook.Sheets['生产日报表'],
      { header: 1 },
    )

    expect(dailyRows[2]).toEqual([
      '7.8',
      '李自芬',
      '电梯料',
      '',
      '',
      300,
      '支',
      '喷涂',
      0,
      0,
      '',
      0,
      '',
      '',
      300,
    ])
    expect(dailyRows[4]).toEqual([
      '合计',
      '',
      '',
      '',
      '',
      310,
      '',
      '',
      '',
      15,
      2,
      3,
      '',
      '',
      300,
    ])
  })

  it('uses packaging quantity as qualified weight when unit is kilogram', () => {
    const buffer = buildWorkbook([
      {
        id: 'order-1',
        work_date: '2026-07-08',
        employee_id: 'employee-1',
        employee_name: '谭玉芳',
        employee_hourly_wage: 20,
        employee_position_salary: 100,
        project_no: 'P-KG',
        product_model: 'M-KG',
        color_name: '喷涂',
        process_name: null,
        length_mm: 1000,
        part_no: null,
        weight_per_meter_kg: 2,
        unit: '千克',
        quantity: 2371,
        defective_quantity: 0,
        defective_weight_kg: 0,
        defect_reason: null,
        standard_seconds: 360,
        work_hours: 1,
        extra_qualified_hours: 0,
        remark: null,
        created_at: '2026-07-08T00:00:00Z',
        updated_at: '2026-07-08T00:00:00Z',
      },
    ] as PackagingWorkOrder[])

    const workbook = XLSX.read(buffer, { type: 'array' })
    const dailyRows = XLSX.utils.sheet_to_json<Array<string | number>>(
      workbook.Sheets['生产日报表'],
      { header: 1 },
    )

    expect(dailyRows[2]).toEqual([
      '7.8',
      '谭玉芳',
      'M-KG',
      'P-KG',
      1000,
      2371,
      '千克',
      '喷涂',
      2,
      2371,
      '',
      0,
      '',
      '',
      '',
    ])
  })
})
