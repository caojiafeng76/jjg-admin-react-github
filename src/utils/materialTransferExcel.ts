import * as XLSX from 'xlsx-js-style'

import type { MaterialTransferWithEmployee } from '@/services/apiMaterialTransfers'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const SHEET_TITLE = '精加工车间物料转移登记表'

const EXPORT_HEADERS = [
  '创建时间',
  '项目号',
  '客户',
  '型号',
  '长度(mm)',
  '客户型号',
  '转移数量',
  '操作人',
  '接收车间',
  '接收人',
  '当班负责人',
  '检验人',
  '数据上传',
  '审核状态',
  '审核时间',
  '备注',
] as const

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString('zh-CN')
}

export function exportMaterialTransfersToExcel(
  records: MaterialTransferWithEmployee[],
) {
  const rows = records.map((record) => [
    formatDateTime(record.created_at),
    record.project_no,
    record.customer || '',
    record.product_model || '',
    record.length_mm ?? '',
    record.customer_model || '',
    record.transfer_quantity,
    record.operator_names.join('、'),
    record.target_workshop,
    record.recipient_name,
    record.shift_leader_name || '',
    record.inspector_name || '',
    record.uploaded_by_name || '',
    record.is_audited ? '已审核' : '待审核',
    formatDateTime(record.audited_at),
    record.remark || '',
  ])

  const worksheetData = [
    [SHEET_TITLE, ...EXPORT_HEADERS.slice(1).map(() => '')],
    EXPORT_HEADERS as unknown as Array<string | number>,
    ...rows,
  ]
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: EXPORT_HEADERS.length - 1 },
    },
  ]

  autoFitColumnWidths(worksheet, worksheetData)
  centerAllCells(worksheet, worksheetData)
  setRowHeight(worksheet, 22, worksheetData.length)

  const titleCellRef = XLSX.utils.encode_cell({ r: 0, c: 0 })
  if (worksheet[titleCellRef]) {
    worksheet[titleCellRef].s = {
      ...(worksheet[titleCellRef].s || {}),
      font: {
        ...(worksheet[titleCellRef].s?.font || {}),
        bold: true,
        name: '宋体',
        sz: 14,
      },
      alignment: {
        ...(worksheet[titleCellRef].s?.alignment || {}),
        horizontal: 'center',
        vertical: 'center',
      },
      fill: {
        fgColor: { rgb: 'FFFFFF' },
      },
    }
  }

  for (let column = 0; column < EXPORT_HEADERS.length; column += 1) {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c: column })

    if (worksheet[cellRef]) {
      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        font: {
          ...(worksheet[cellRef].s?.font || {}),
          bold: true,
          name: '宋体',
          sz: 11,
        },
        fill: {
          fgColor: { rgb: 'D9EAF7' },
        },
        border: {
          top: { style: 'thin', color: { rgb: 'B7C9D6' } },
          bottom: { style: 'thin', color: { rgb: 'B7C9D6' } },
          left: { style: 'thin', color: { rgb: 'B7C9D6' } },
          right: { style: 'thin', color: { rgb: 'B7C9D6' } },
        },
      }
    }
  }

  if (!worksheet['!rows']) {
    worksheet['!rows'] = []
  }

  worksheet['!rows'][0] = { hpt: 28, hpx: 28 }
  worksheet['!freeze'] = { xSplit: 0, ySplit: 2 }

  XLSX.utils.book_append_sheet(workbook, worksheet, '物料转移单')
  XLSX.writeFile(
    workbook,
    `物料转移单_${new Date().toISOString().slice(0, 10)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}