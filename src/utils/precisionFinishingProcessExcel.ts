import * as XLSX from 'xlsx-js-style'

import type { StandardTime } from '@/services/apiStandardTimes'
import {
  embedSketchFilesIntoFirstWorksheet,
  type WorksheetSketchPlacement,
} from './workshopOrderSketchXlsx'

export const PROCESS_SHEET_HEADERS = [
  '序号',
  '客户名',
  '型号',
  '长度',
  '料号',
  '工序',
  '工时（S)',
  '工装治具',
  '装夹次数',
  '装夹数量(支）',
  '人数',
  '图示（切割、普通台虎钳通用图片）',
  '说明',
  '备注',
] as const

const PROCESS_SHEET_TITLE = '精加工产品工艺明细表'

const COLUMN_WIDTHS = [8, 24, 14, 12, 24, 18, 12, 18, 12, 16, 8, 24, 24, 20]

const BORDER_STYLE = {
  top: { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left: { style: 'thin', color: { rgb: '000000' } },
  right: { style: 'thin', color: { rgb: '000000' } },
}

const TITLE_STYLE = {
  font: { name: '宋体', sz: 18, bold: true },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_STYLE,
}

const HEADER_STYLE = {
  font: { name: '宋体', sz: 11, bold: true },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_STYLE,
}

const BODY_STYLE = {
  font: { name: '宋体', sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: BORDER_STYLE,
}

export type ProcessSheetImageResolver = (
  record: StandardTime,
) => Promise<WorksheetSketchPlacement | null>

function setCellStyle(
  worksheet: XLSX.WorkSheet,
  rowIndex: number,
  colIndex: number,
  style: Record<string, unknown>,
) {
  const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })

  if (!worksheet[cellRef]) {
    worksheet[cellRef] = { t: 's', v: '' }
  }

  worksheet[cellRef].s = style
}

function applyStyles(worksheet: XLSX.WorkSheet, rowCount: number) {
  for (
    let colIndex = 0;
    colIndex < PROCESS_SHEET_HEADERS.length;
    colIndex += 1
  ) {
    setCellStyle(worksheet, 0, colIndex, TITLE_STYLE)
    setCellStyle(worksheet, 1, colIndex, HEADER_STYLE)
  }

  for (let rowIndex = 2; rowIndex < rowCount; rowIndex += 1) {
    for (
      let colIndex = 0;
      colIndex < PROCESS_SHEET_HEADERS.length;
      colIndex += 1
    ) {
      setCellStyle(worksheet, rowIndex, colIndex, BODY_STYLE)
    }
  }
}

function getRows(records: StandardTime[]) {
  return records.map((record, index) => [
    index + 1,
    record.customer ?? null,
    record.model,
    record.length ?? null,
    record.part_no ?? null,
    record.operation,
    record.standard_seconds ?? null,
    record.tooling_fixture ?? null,
    record.clamping_count ?? null,
    record.clamping_quantity ?? null,
    record.operator_count ?? null,
    null,
    record.process_note ?? null,
    record.remark ?? null,
  ])
}

export async function buildPrecisionFinishingProcessExcelBuffer(
  records: StandardTime[],
  resolveImage?: ProcessSheetImageResolver,
) {
  const rows = getRows(records)
  const worksheetData = [
    [PROCESS_SHEET_TITLE, ...Array(PROCESS_SHEET_HEADERS.length - 1).fill('')],
    [...PROCESS_SHEET_HEADERS],
    ...rows,
  ]
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: PROCESS_SHEET_HEADERS.length - 1 },
    },
  ]
  worksheet['!cols'] = COLUMN_WIDTHS.map((width) => ({ wch: width }))
  worksheet['!rows'] = [
    { hpt: 30, hpx: 30 },
    { hpt: 42, hpx: 42 },
    ...rows.map(() => ({ hpt: 66, hpx: 66 })),
  ]
  applyStyles(worksheet, worksheetData.length)
  XLSX.utils.book_append_sheet(workbook, worksheet, '精加工产品工艺表')

  let workbookBuffer = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
  }) as ArrayBuffer

  if (!resolveImage) {
    return workbookBuffer
  }

  const images: WorksheetSketchPlacement[] = []
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index]
    if (!record.process_image_path) continue

    try {
      const image = await resolveImage(record)
      if (image) {
        images.push({ ...image, rowNumber: index + 3, columnNumber: 12 })
      }
    } catch (error) {
      console.warn('工艺图示导出失败，已跳过图片:', error)
    }
  }

  if (images.length > 0) {
    workbookBuffer = await embedSketchFilesIntoFirstWorksheet(
      workbookBuffer,
      images,
    )
  }

  return workbookBuffer
}

export async function exportPrecisionFinishingProcessToExcel(
  records: StandardTime[],
  resolveImage?: ProcessSheetImageResolver,
) {
  const buffer = await buildPrecisionFinishingProcessExcelBuffer(
    records,
    resolveImage,
  )
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `精加工产品工艺表_${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
