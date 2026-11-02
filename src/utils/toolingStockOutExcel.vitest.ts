import { describe, expect, it } from 'vitest'

import * as XLSX from 'xlsx-js-style'
import { parseToolingStockOutExcel } from './toolingStockOutExcel'

function createExcelFile(rows: Array<Array<unknown>>): File {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '刀具出库导入模板')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new File([buffer], '刀具出库.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('parseToolingStockOutExcel', () => {
  it('accepts integer quantity and rejects decimal quantity', async () => {
    const result = await parseToolingStockOutExcel(
      createExcelFile([
        ['刀具编号', '刀具名称', '领用人', '用途', '出库日期', '出库数量', '领用方式', '备注'],
        ['T-001', '立铣刀', '张三', '加工', '2026-11-02', 3, '新领取', ''],
        ['T-002', '钻头', '李四', '加工', '2026-11-02', 1.5, '新领取', ''],
      ]),
    )

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      tool_code: 'T-001',
      stock_out_quantity: 3,
    })
    expect(result.errors).toEqual([
      '第 3 行出库数量格式无效，需为大于 0 的整数',
    ])
  })
})
