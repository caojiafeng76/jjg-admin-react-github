import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { ProductionOrderForExport } from '@/services/apiProductionOrders'
import { buildProductionOrderExcelBuffer } from './productionOrderExcelWorkbook'

function createOrder(
  employeeName: string,
  isExternal: boolean,
  totalQualifiedHours: number,
): ProductionOrderForExport {
  return {
    id: `order-${employeeName}`,
    created_at: '2026-06-01T08:00:00',
    updated_at: '2026-06-01T08:00:00',
    employee_id: `employee-${employeeName}`,
    order_date: '2026-06-01',
    work_hours: 8,
    extra_qualified_hours: 0,
    total_qualified_hours: totalQualifiedHours,
    efficiency: 1,
    shift: '白班',
      remark: null,
      is_audited: true,
      audited_at: null,
      status: 'draft',
      employee: {
      id: `employee-${employeeName}`,
      name: employeeName,
      job_name: '操作工',
      hourly_wage: 20,
      coefficient: 1,
      is_external: isExternal,
    },
    items: [],
  } as ProductionOrderForExport
}

describe('buildProductionOrderExcelBuffer', () => {
  it('splits summary sheets by external employee flag', () => {
    const buffer = buildProductionOrderExcelBuffer([
      createOrder('张三', false, 8),
      createOrder('李四', true, 6),
    ])
    const workbook = XLSX.read(buffer, { type: 'array' })

    expect(workbook.SheetNames.slice(0, 2)).toEqual([
      '汇总表-非外来',
      '汇总表-外来',
      ])

      expect(workbook.Sheets['汇总表-非外来'].B3?.v).toBe('张三')
      expect(workbook.Sheets['汇总表-非外来'].B4?.v).not.toBe('李四')
      expect(workbook.Sheets['汇总表-外来'].B3?.v).toBe('李四')
      expect(workbook.Sheets['汇总表-外来'].B4?.v).not.toBe('张三')
    })
  })
