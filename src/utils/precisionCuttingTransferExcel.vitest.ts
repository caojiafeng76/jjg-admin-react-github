import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { PrecisionCuttingTransferExportRow } from '@/services/apiPrecisionCuttingTransfers'
import { exportPrecisionCuttingTransfersToExcel } from './precisionCuttingTransferExcel'

const writeFileMock = vi.hoisted(() => vi.fn())

vi.mock('xlsx-js-style', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const xlsx = (actual.default ?? actual) as typeof import('xlsx-js-style')

  return {
    ...actual,
    ...xlsx,
    default: {
      ...xlsx,
      writeFile: writeFileMock,
    },
    writeFile: writeFileMock,
  }
})

function createRecord(
  overrides: Partial<PrecisionCuttingTransferExportRow> = {},
): PrecisionCuttingTransferExportRow {
  return {
    audited_at: null,
    created_at: '2026-08-03T08:00:00.000Z',
    customer: '客户A',
    customer_model: '客户型号A',
    defect_reason: null,
    id: 'transfer-001',
    inspector_name: '检验员',
    is_audited: false,
    length_mm: 1000,
    long_material_length_mm: 6000,
    long_material_quantity: 10,
    operator_names: ['张三'],
    outsource_defect_quantity: 0,
    outsource_defect_reason: null,
    outsource_unit: null,
    process_owner: null,
    processing_defect_count: 0,
    processing_defect_weight_kg: 0,
    product_model: '型号A',
    project_no: 'P-001',
    raw_material_defect_count: 0,
    raw_material_defect_weight_kg: 0,
    recipient_name: '李四',
    remark: null,
    responsible_process: null,
    target_workshop: '仓库',
    transfer_quantity: 10,
    updated_at: '2026-08-03T08:00:00.000Z',
    uploaded_by_name: '上传人',
    ...overrides,
    process_card_long_material_quantity:
      overrides.process_card_long_material_quantity ?? null,
    erp_long_material_quantity: overrides.erp_long_material_quantity ?? null,
  }
}

function getWorksheet(): XLSX.WorkSheet {
  const workbook = vi.mocked(XLSX.writeFile).mock.calls[0]?.[0] as XLSX.WorkBook
  return workbook.Sheets[workbook.SheetNames[0]]
}

describe('exportPrecisionCuttingTransfersToExcel', () => {
  beforeEach(() => {
    writeFileMock.mockClear()
  })

  it('exports actual, process-card and ERP long-material quantities with difference formulas', () => {
    const record = Object.assign(createRecord(), {
      process_card_long_material_quantity: 12,
      erp_long_material_quantity: 8,
    })

    exportPrecisionCuttingTransfersToExcel([record])

    const worksheet = getWorksheet()

    expect(worksheet.H2?.v).toBe('实际长料数量')
    expect(worksheet.I2?.v).toBe('流程卡长料数量')
    expect(worksheet.J2?.v).toBe('与流程卡长料数量差异')
    expect(worksheet.K2?.v).toBe('ERP长料数量')
    expect(worksheet.L2?.v).toBe('与ERP长料数量差异')
    expect(worksheet.H3?.v).toBe(10)
    expect(worksheet.I3?.v).toBe(12)
    expect(worksheet.J3?.f).toBe('H3-I3')
    expect(worksheet.J3?.v).toBe(-2)
    expect(worksheet.K3?.v).toBe(8)
    expect(worksheet.L3?.f).toBe('H3-K3')
    expect(worksheet.L3?.v).toBe(2)
  })

  it('leaves differences blank when process-card or ERP quantities are absent', () => {
    exportPrecisionCuttingTransfersToExcel([createRecord()])

    const worksheet = getWorksheet()

    expect(worksheet.I3?.v).toBe('')
    expect(worksheet.J3?.v).toBe('')
    expect(worksheet.J3?.f).toBeUndefined()
    expect(worksheet.K3?.v).toBe('')
    expect(worksheet.L3?.v).toBe('')
    expect(worksheet.L3?.f).toBeUndefined()
  })
})
