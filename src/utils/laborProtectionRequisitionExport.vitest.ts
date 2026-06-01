import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type { LaborProtectionRequisition } from '@/services/apiLaborProtectionRequisitions'
import { exportLaborProtectionRequisitionsToExcel } from './laborProtectionRequisitionExport'

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

function createRequisition(
  id: string,
  category: string,
  quantity: number,
): LaborProtectionRequisition {
  return {
    id,
    labor_protection_data_id: `labor-protection-data-${id}`,
    machine_equipment_id: null,
    category,
    machine_no: '',
    machine_name: '',
    job_title: '操作工',
    quantity,
    recipient: '张三',
    collection_method: '新领取',
    created_at: '2026-05-28T08:00:00',
    updated_at: '2026-05-28T08:00:00',
  }
}

describe('exportLaborProtectionRequisitionsToExcel', () => {
  beforeEach(() => {
    writeFileMock.mockClear()
  })

  it('moves saw blade categories to a separate summary worksheet', () => {
    exportLaborProtectionRequisitionsToExcel(
      [
        createRequisition('001', '防化手套（胶手套）', 2),
        createRequisition('002', '锯片-450*4.0*30*120-多头', 4),
        createRequisition('003', '锯片-470*4.0*30*120-多头', 5),
      ],
      {},
    )

    const workbook = vi.mocked(XLSX.writeFile).mock.calls[0][0] as XLSX.WorkBook
    const summarySheet = workbook.Sheets['按种类汇总']
    const sawBladeSheet = workbook.Sheets['锯片汇总']

    expect(workbook.SheetNames).toEqual(['领料明细', '按种类汇总', '锯片汇总'])
    expect(summarySheet.B4?.v).toBe('防化手套（胶手套）')
    expect(summarySheet.C5?.v).toBe(2)
    expect(summarySheet.D5?.v).toBe(1)

    expect(sawBladeSheet.B4?.v).toBe('锯片-450*4.0*30*120-多头')
    expect(sawBladeSheet.B5?.v).toBe('锯片-470*4.0*30*120-多头')
    expect(sawBladeSheet.C6?.v).toBe(9)
    expect(sawBladeSheet.D6?.v).toBe(2)
  })

  it('moves cutting oil and cutting fluid categories to the saw blade summary worksheet', () => {
    exportLaborProtectionRequisitionsToExcel(
      [
        createRequisition('001', '防化手套（胶手套）', 2),
        createRequisition('002', '切割油', 4),
        createRequisition('003', '切削液', 6),
      ],
      {},
    )

    const workbook = vi.mocked(XLSX.writeFile).mock.calls[0][0] as XLSX.WorkBook
    const summarySheet = workbook.Sheets['按种类汇总']
    const sawBladeSheet = workbook.Sheets['锯片汇总']

    expect(workbook.SheetNames).toEqual(['领料明细', '按种类汇总', '锯片汇总'])
    expect(summarySheet.B4?.v).toBe('防化手套（胶手套）')
    expect(summarySheet.C5?.v).toBe(2)
    expect(summarySheet.D5?.v).toBe(1)

    expect([sawBladeSheet.B4?.v, sawBladeSheet.B5?.v]).toEqual(
      expect.arrayContaining(['切割油', '切削液']),
    )
    expect(sawBladeSheet.C6?.v).toBe(10)
    expect(sawBladeSheet.D6?.v).toBe(2)
  })
})
