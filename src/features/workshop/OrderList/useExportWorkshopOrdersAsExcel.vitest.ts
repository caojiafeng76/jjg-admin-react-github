import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import { createWorkshopOrderWorkbookBuffer } from './useExportWorkshopOrdersAsExcel'

describe('createWorkshopOrderWorkbookBuffer', () => {
  it('adds a centered title row above QR and sketch headers', () => {
    const workbookBuffer = createWorkshopOrderWorkbookBuffer([])
    const workbook = XLSX.read(workbookBuffer, { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    expect(worksheet.A1?.v).toBe('精加工车间生产订单')
    expect(worksheet.A2?.v).toBe('二维码')
    expect(worksheet.B2?.v).toBe('简图')
    expect(worksheet['!merges']).toEqual(
      expect.arrayContaining([
        {
          s: { r: 0, c: 0 },
          e: { r: 0, c: 17 },
        },
      ]),
    )
  })
})
