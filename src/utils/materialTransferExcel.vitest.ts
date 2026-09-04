import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as XLSX from 'xlsx-js-style'

import type {
  MaterialTransferOrderProgress,
  MaterialTransferWithEmployee,
} from '@/services/apiMaterialTransfers'
import { exportMaterialTransfersToExcel } from './materialTransferExcel'

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
  id: string,
  transferQuantity: number,
  projectNo = `P-${id}`,
): MaterialTransferWithEmployee {
  return {
    id,
    audited_at: null,
    created_at: '2026-05-28T08:00:00',
    customer: '客户A',
    customer_model: '客户型号A',
    employee: null,
    inspector_name: '检验员',
    is_audited: false,
    length_mm: 1000,
    operator_employee_id: 'employee-1',
    operator_employee_ids: ['employee-1'],
    operator_names: ['张三'],
    product_model: 'M1',
    project_no: projectNo,
    recipient_name: '李四',
    remark: '备注',
    shift_leader_name: '王五',
    target_workshop: '仓库',
    transfer_quantity: transferQuantity,
    updated_at: '2026-05-28T08:00:00',
    uploaded_by_name: '赵六',
  }
}

function createProgress(
  transferTotal: number,
  orderQuantity: number | null,
): MaterialTransferOrderProgress {
  if (!orderQuantity || orderQuantity <= 0) {
    return {
      transferTotal,
      orderQuantity,
      completionRate: null,
      isCompleted: false,
    }
  }
  const completionRate = (transferTotal / orderQuantity) * 100
  return {
    transferTotal,
    orderQuantity,
    completionRate,
    isCompleted: completionRate >= 100,
  }
}

describe('exportMaterialTransfersToExcel', () => {
  beforeEach(() => {
    writeFileMock.mockClear()
  })

  it('adds a final total row for transfer quantity', () => {
    exportMaterialTransfersToExcel([
      createRecord('001', 12),
      createRecord('002', 8),
    ])

    const workbook = vi.mocked(XLSX.writeFile).mock.calls[0][0] as XLSX.WorkBook
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    expect(worksheet.F5?.v).toBe('合计')
    expect(worksheet.G5?.f).toBe('SUM(G3:G4)')
    expect(worksheet.G5?.v).toBe(20)
  })

  it('writes order progress and status from the provided map', () => {
    const progressMap = new Map<string, MaterialTransferOrderProgress>([
      ['P-001', createProgress(120, 100)],
      ['P-002', createProgress(50, 200)],
    ])

    exportMaterialTransfersToExcel(
      [createRecord('001', 120, 'P-001'), createRecord('002', 50, 'P-002')],
      progressMap,
    )

    const workbook = vi.mocked(XLSX.writeFile).mock.calls[0][0] as XLSX.WorkBook
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    expect(worksheet.Q3?.v).toBe('120.0%')
    expect(worksheet.R3?.v).toBe('完工')
    expect(worksheet.Q4?.v).toBe('25.0%')
    expect(worksheet.R4?.v).toBe('未完工')
  })

  it('leaves order progress and status empty when map is missing entries', () => {
    exportMaterialTransfersToExcel([createRecord('001', 10, 'P-001')])

    const workbook = vi.mocked(XLSX.writeFile).mock.calls[0][0] as XLSX.WorkBook
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]

    expect(worksheet.Q3?.v).toBe('')
    expect(worksheet.R3?.v).toBe('')
  })

  it('adds a summary worksheet that groups the same product in the same workshop', () => {
    exportMaterialTransfersToExcel([
      createRecord('001', 12, 'P-001'),
      {
        ...createRecord('002', 8, 'P-001'),
        operator_names: ['李四'],
      },
      {
        ...createRecord('003', 5, 'P-001'),
        target_workshop: '装配车间',
      },
      createRecord('004', 7, 'P-002'),
    ])

    const workbook = vi.mocked(XLSX.writeFile).mock.calls[0][0] as XLSX.WorkBook
    const worksheet = workbook.Sheets['汇总表']

    expect(workbook.SheetNames).toEqual(['物料转移单', '汇总表'])
    expect(worksheet.A1?.v).toBe(
      '5月28日精加工车间订单物料转移、进度、状态汇总表',
    )
    expect(worksheet.G3?.v).toBe(20)
    expect(worksheet.H3?.v).toBe('张三、李四')
    expect(worksheet.I3?.v).toBe('仓库')
    expect(worksheet.G4?.v).toBe(5)
    expect(worksheet.I4?.v).toBe('装配车间')
    expect(worksheet.G5?.v).toBe(7)
  })
})
