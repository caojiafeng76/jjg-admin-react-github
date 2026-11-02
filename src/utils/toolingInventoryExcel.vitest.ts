import { describe, expect, it } from 'vitest'

import * as XLSX from 'xlsx-js-style'
import { parseToolingInventoryExcel } from './toolingInventoryExcel'

function createExcelFile(rows: Array<Array<unknown>>): File {
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '刀具库存导入模板')
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

  return new File([buffer], '刀具库存.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('parseToolingInventoryExcel', () => {
  it('accepts integer stock and rejects decimal stock', async () => {
    const result = await parseToolingInventoryExcel(
      createExcelFile([
        ['刀具编号', '现有库存', '备注'],
        ['T-001', 12, ''],
        ['T-002', 2.5, ''],
      ]),
    )

    expect(result.rows).toEqual([
      { tool_code: 'T-001', current_stock: 12, remarks: '' },
    ])
    expect(result.errors).toEqual([
      '第 3 行现有库存格式无效，需为大于等于 0 的整数',
    ])
  })
})
