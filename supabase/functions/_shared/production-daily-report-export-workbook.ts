import * as XLSX from 'npm:xlsx-js-style@1.2.0'

export interface ProductionDailyReportExportRow {
  key: string
  orderDate: string
  dataCategory: 'A' | 'B'
  projectNo: string
  productModel: string
  customerModel: string
  incomingQualifiedCount: number
  lengthMm: number | null
  operation: string
  qualifiedCount: number
  defectCount: number
  workHours: number
  employeeName: string
  rawMaterialDefectCount: number
  processingDefectCount: number
  outsourceDefectCount: number
  outsourceDefectReason: string
  outsourceUnit: string
  setupDefectCount: number
  setupResponsible: string
  qualifiedRate: number
  rawMaterialDefectWeightKg: number
  processingDefectWeightKg: number
  outsourceDefectWeightKg: number
  setupDefectWeightKg: number
  remark: string
}

const EXCEL_WRITE_OPTIONS = {
  cellStyles: true,
}

const WORK_HOURS_COLUMN_INDEX = 1
const INCOMING_QUALIFIED_COUNT_COLUMN_INDEX = 8
const QUALIFIED_COUNT_COLUMN_INDEX = 9
const DEFECT_COUNT_COLUMN_INDEX = 10
const RAW_MATERIAL_DEFECT_COUNT_COLUMN_INDEX = 11
const PROCESSING_DEFECT_COUNT_COLUMN_INDEX = 12
const OUTSOURCE_DEFECT_COUNT_COLUMN_INDEX = 13
const SETUP_DEFECT_COUNT_COLUMN_INDEX = 16
const QUALIFIED_RATE_COLUMN_INDEX = 18
const RAW_MATERIAL_DEFECT_WEIGHT_COLUMN_INDEX = 19
const PROCESSING_DEFECT_WEIGHT_COLUMN_INDEX = 20
const OUTSOURCE_DEFECT_WEIGHT_COLUMN_INDEX = 21
const SETUP_DEFECT_WEIGHT_COLUMN_INDEX = 22

const REPORT_HEADERS = [
  '日期',
  '工时',
  '数据类别',
  '项目号',
  '产品型号',
  '客户型号',
  '长度',
  '工序',
  '来料合格数',
  '成品合格数',
  '不良数量',
  '原料不良',
  '加工不良',
  '外协不良数',
  '外协不良原因',
  '外协单位',
  '调机不良',
  '调机负责人',
  '合格率',
  '原料不良重量kg',
  '加工不良重量kg',
  '外协不良重量kg',
  '调机不良重量kg',
  '操作人',
  '备注',
] as const

const REPORT_TITLE = '精加工车间日产量汇总'

function getColumnLetter(columnIndex: number) {
  let letter = ''
  let currentIndex = columnIndex

  while (currentIndex >= 0) {
    letter = String.fromCharCode((currentIndex % 26) + 65) + letter
    currentIndex = Math.floor(currentIndex / 26) - 1
  }

  return letter
}

function getTextDisplayWidth(text: string): number {
  return text.split(/\r?\n/).reduce((maxWidth, line) => {
    let width = 0

    for (let index = 0; index < line.length; index += 1) {
      const code = line.charCodeAt(index)

      if (
        (code >= 0x4e00 && code <= 0x9fff) ||
        (code >= 0x3400 && code <= 0x4dbf) ||
        (code >= 0xf900 && code <= 0xfaff) ||
        (code >= 0x3000 && code <= 0x303f) ||
        (code >= 0xff00 && code <= 0xffef)
      ) {
        width += 2
      } else {
        width += 1
      }
    }

    return Math.max(maxWidth, width)
  }, 0)
}

function autoFitColumnWidths(
  worksheet: XLSX.WorkSheet,
  data: Array<Array<string | number | null | undefined>>,
  minWidth = 8,
  maxWidth = 60,
) {
  if (data.length === 0) {
    return
  }

  const columnCount = data[0].length
  const widths: { wch: number; wpx: number }[] = []

  for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
    let maxLen = minWidth

    for (let rowIndex = 0; rowIndex < data.length; rowIndex += 1) {
      const cell = data[rowIndex][columnIndex]

      if (cell === null || cell === undefined) {
        continue
      }

      maxLen = Math.max(maxLen, getTextDisplayWidth(String(cell)))
    }

    const width = Math.min(Math.max(maxLen + 4, minWidth), maxWidth)
    widths.push({
      wch: width,
      wpx: Math.round(width * 8 + 12),
    })
  }

  worksheet['!cols'] = widths
}

function setRowHeight(
  worksheet: XLSX.WorkSheet,
  rowHeight: number,
  rowCount: number,
) {
  worksheet['!rows'] = Array.from({ length: rowCount }, () => ({
    hpt: rowHeight,
    hpx: rowHeight,
  }))
}

function centerAllCells(
  worksheet: XLSX.WorkSheet,
  data: Array<Array<unknown>>,
) {
  if (data.length === 0) {
    return
  }

  for (let rowIndex = 0; rowIndex < data.length; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < data[0].length; columnIndex += 1) {
      const cellRef = `${getColumnLetter(columnIndex)}${rowIndex + 1}`

      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { v: '' }
      }

      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        font: {
          ...(worksheet[cellRef].s?.font || {}),
          name: '宋体',
          sz: 11,
        },
        alignment: {
          ...(worksheet[cellRef].s?.alignment || {}),
          horizontal: 'center',
          vertical: 'center',
        },
      }
    }
  }
}

function buildWorksheetData(rows: ProductionDailyReportExportRow[]) {
  return [
    [REPORT_TITLE, ...REPORT_HEADERS.slice(1).map(() => '')],
    [...REPORT_HEADERS],
    ...rows.map((row) => [
      row.orderDate,
      row.workHours,
      row.dataCategory,
      row.projectNo,
      row.productModel,
      row.customerModel,
      row.lengthMm ?? '',
      row.operation,
      row.incomingQualifiedCount,
      row.qualifiedCount,
      row.defectCount,
      row.rawMaterialDefectCount,
      row.processingDefectCount,
      row.outsourceDefectCount,
      row.outsourceDefectReason,
      row.outsourceUnit,
      row.setupDefectCount,
      row.setupResponsible,
      row.qualifiedRate,
      row.rawMaterialDefectWeightKg,
      row.processingDefectWeightKg,
      row.outsourceDefectWeightKg,
      row.setupDefectWeightKg,
      row.employeeName,
      row.remark,
    ]),
  ]
}

function createProductionDailyReportWorkbook(
  rows: ProductionDailyReportExportRow[],
) {
  const worksheetData = buildWorksheetData(rows)
  const firstDataRow = 3
  const lastDataRow = rows.length + 2
  const summaryRowIndex = worksheetData.length + 1
  const numericColumnIndexes = [
    WORK_HOURS_COLUMN_INDEX,
    INCOMING_QUALIFIED_COUNT_COLUMN_INDEX,
    QUALIFIED_COUNT_COLUMN_INDEX,
    DEFECT_COUNT_COLUMN_INDEX,
    RAW_MATERIAL_DEFECT_COUNT_COLUMN_INDEX,
    PROCESSING_DEFECT_COUNT_COLUMN_INDEX,
    OUTSOURCE_DEFECT_COUNT_COLUMN_INDEX,
    SETUP_DEFECT_COUNT_COLUMN_INDEX,
    RAW_MATERIAL_DEFECT_WEIGHT_COLUMN_INDEX,
    PROCESSING_DEFECT_WEIGHT_COLUMN_INDEX,
    OUTSOURCE_DEFECT_WEIGHT_COLUMN_INDEX,
    SETUP_DEFECT_WEIGHT_COLUMN_INDEX,
  ]
  const summaryRow = REPORT_HEADERS.map((_header, columnIndex) =>
    columnIndex === 0 ? '汇总' : '',
  )

  worksheetData.push(summaryRow)

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: REPORT_HEADERS.length - 1 },
    },
  ]

  numericColumnIndexes.forEach((columnIndex) => {
    const columnLetter = getColumnLetter(columnIndex)
    const cellRef = XLSX.utils.encode_cell({
      r: summaryRowIndex - 1,
      c: columnIndex,
    })

    worksheet[cellRef] = {
      t: 'n',
      f: `SUM(${columnLetter}${firstDataRow}:${columnLetter}${lastDataRow})`,
      z:
        columnIndex === WORK_HOURS_COLUMN_INDEX ||
        columnIndex === RAW_MATERIAL_DEFECT_WEIGHT_COLUMN_INDEX ||
        columnIndex === PROCESSING_DEFECT_WEIGHT_COLUMN_INDEX ||
        columnIndex === OUTSOURCE_DEFECT_WEIGHT_COLUMN_INDEX ||
        columnIndex === SETUP_DEFECT_WEIGHT_COLUMN_INDEX
          ? '0.00'
          : '0',
      s: worksheet[cellRef]?.s,
    }
  })

  const qualifiedRateCellRef = XLSX.utils.encode_cell({
    r: summaryRowIndex - 1,
    c: QUALIFIED_RATE_COLUMN_INDEX,
  })
  const incomingQualifiedCountColumnLetter = getColumnLetter(
    INCOMING_QUALIFIED_COUNT_COLUMN_INDEX,
  )
  const qualifiedCountColumnLetter = getColumnLetter(
    QUALIFIED_COUNT_COLUMN_INDEX,
  )

  worksheet[qualifiedRateCellRef] = {
    t: 'n',
    f: `IFERROR(${qualifiedCountColumnLetter}${summaryRowIndex}/${incomingQualifiedCountColumnLetter}${summaryRowIndex},0)`,
    z: '0.00%',
    s: worksheet[qualifiedRateCellRef]?.s,
  }

  autoFitColumnWidths(worksheet, worksheetData)
  centerAllCells(worksheet, worksheetData)
  setRowHeight(worksheet, 22, worksheetData.length)

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
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

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const headerRef = XLSX.utils.encode_cell({ r: 1, c: column })

    if (!worksheet[headerRef]) {
      continue
    }

    worksheet[headerRef].s = {
      ...(worksheet[headerRef].s || {}),
      font: {
        ...(worksheet[headerRef].s?.font || {}),
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

  for (let column = range.s.c; column <= range.e.c; column += 1) {
    const summaryRef = XLSX.utils.encode_cell({
      r: summaryRowIndex - 1,
      c: column,
    })

    if (!worksheet[summaryRef]) {
      continue
    }

    worksheet[summaryRef].s = {
      ...(worksheet[summaryRef].s || {}),
      font: {
        ...(worksheet[summaryRef].s?.font || {}),
        bold: true,
        name: '宋体',
        sz: 11,
      },
      fill: {
        fgColor: { rgb: 'FFF2CC' },
      },
      border: {
        top: { style: 'thin', color: { rgb: 'D6B656' } },
        bottom: { style: 'thin', color: { rgb: 'D6B656' } },
        left: { style: 'thin', color: { rgb: 'D6B656' } },
        right: { style: 'thin', color: { rgb: 'D6B656' } },
      },
    }
  }

  for (let rowIndex = 2; rowIndex < summaryRowIndex - 1; rowIndex += 1) {
    const cellRef = XLSX.utils.encode_cell({
      r: rowIndex,
      c: QUALIFIED_RATE_COLUMN_INDEX,
    })

    if (worksheet[cellRef]) {
      worksheet[cellRef].z = '0.00%'
    }
  }

  worksheet['!rows'] ||= []
  worksheet['!rows'][0] = { hpt: 28, hpx: 28 }
  worksheet['!freeze'] = { xSplit: 0, ySplit: 2 }
  ;(
    workbook as XLSX.WorkBook & { Workbook?: Record<string, unknown> }
  ).Workbook = {
    CalcPr: {
      calcMode: 'auto',
      fullCalcOnLoad: '1',
      forceFullCalc: '1',
    },
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, '生产日报表')

  return workbook
}

export function getProductionDailyReportExportFilename() {
  return `生产日报表_${new Date().toISOString().slice(0, 10)}.xlsx`
}

export function buildProductionDailyReportExcelBuffer(
  rows: ProductionDailyReportExportRow[],
) {
  const workbook = createProductionDailyReportWorkbook(rows)

  return XLSX.write(workbook, {
    ...EXCEL_WRITE_OPTIONS,
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer
}
