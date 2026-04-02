import * as XLSX from 'xlsx-js-style'

import type { PrecisionCuttingTransferExportRow } from '@/services/apiPrecisionCuttingTransfers'
import {
  autoFitColumnWidths,
  centerAllCells,
  EXCEL_WRITE_OPTIONS,
  setRowHeight,
} from '@/utils/excelStyleUtils'

const SHEET_TITLE = '精切转移单登记表'

const EXPORT_HEADERS = [
  '创建时间',
  '项目号',
  '客户',
  '型号',
  '长度(mm)',
  '客户型号',
  '长料长度(mm)',
  '长料数量',
  '原料不良数',
  '加工不良数',
  '原料不良重量kg',
  '加工不良重量kg',
  '不良原因',
  '转移数量',
  '操作人',
  '接收车间',
  '接收人',
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

export function exportPrecisionCuttingTransfersToExcel(
  records: PrecisionCuttingTransferExportRow[],
) {
  const rows = records.map((record) => [
    formatDateTime(record.created_at),
    record.project_no,
    record.customer || '',
    record.product_model || '',
    record.length_mm ?? '',
    record.customer_model || '',
    record.long_material_length_mm,
    record.long_material_quantity,
    record.raw_material_defect_count,
    record.processing_defect_count,
    record.raw_material_defect_weight_kg,
    record.processing_defect_weight_kg,
    record.defect_reason || '',
    record.transfer_quantity,
    record.operator_names.join('、'),
    record.target_workshop,
    record.recipient_name,
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

  XLSX.utils.book_append_sheet(workbook, worksheet, '精切转移单')
  XLSX.writeFile(
    workbook,
    `精切转移单_${new Date().toISOString().slice(0, 10)}.xlsx`,
    EXCEL_WRITE_OPTIONS,
  )
}