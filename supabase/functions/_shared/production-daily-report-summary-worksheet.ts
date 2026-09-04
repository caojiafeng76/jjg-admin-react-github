import XLSX from 'npm:xlsx-js-style@1.2.0'

export const PRODUCTION_DAILY_REPORT_SUMMARY_SHEET_NAME = '汇总表'

interface ProductionDailyReportSummaryRow {
  key: string
  orderDate: string
  incomingQualifiedCount: number
  qualifiedCount: number
  defectCount: number
  rawMaterialDefectCount: number
  processingDefectCount: number
  outsourceDefectCount: number
  outsourceDefectReason: string
  outsourceUnit: string
  setupDefectCount: number
  setupResponsible: string
  rawMaterialDefectWeightKg: number
  processingDefectWeightKg: number
  outsourceDefectWeightKg: number
  setupDefectWeightKg: number
  remark: string
}

const SUMMARY_TITLE_FALLBACK = '精加工车间日报表汇总明细'
const QUALIFIED_RATE_SUMMARY_ROW_INDEX = 12

const SUMMARY_HEADERS = [
  '序号',
  '汇总项目',
  '汇总结果',
  '异常显示说明',
  '备注',
] as const

function getColumnLetter(columnIndex: number) {
  let letter = ''
  let currentIndex = columnIndex

  while (currentIndex >= 0) {
    letter = String.fromCharCode((currentIndex % 26) + 65) + letter
    currentIndex = Math.floor(currentIndex / 26) - 1
  }

  return letter
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

function sumReportRows(
  rows: ProductionDailyReportSummaryRow[],
  getValue: (row: ProductionDailyReportSummaryRow) => number,
) {
  return rows.reduce((total, row) => total + getValue(row), 0)
}

function joinUniqueText(
  rows: ProductionDailyReportSummaryRow[],
  getValue: (row: ProductionDailyReportSummaryRow) => string,
) {
  const values = rows
    .map((row) => getValue(row).trim())
    .filter((value) => value && value !== '-')

  return Array.from(new Set(values)).join('、') || '-'
}

function buildSummaryTitle(rows: ProductionDailyReportSummaryRow[]) {
  const dates = new Set(rows.map((row) => row.orderDate).filter(Boolean))

  if (dates.size !== 1) {
    return SUMMARY_TITLE_FALLBACK
  }

  const [orderDate] = Array.from(dates)
  const dateParts = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(orderDate)

  if (!dateParts) {
    return SUMMARY_TITLE_FALLBACK
  }

  return `精加工车间${Number(dateParts[2])}月${Number(dateParts[3])}日日报表汇总明细`
}

function buildSummaryWorksheetData(rows: ProductionDailyReportSummaryRow[]) {
  const incomingQualifiedCount = sumReportRows(
    rows,
    (row) => row.incomingQualifiedCount,
  )
  const qualifiedCount = sumReportRows(rows, (row) => row.qualifiedCount)
  const qualifiedRate =
    incomingQualifiedCount > 0 ? qualifiedCount / incomingQualifiedCount : 0
  const summaryRows = [
    ['来料合格数', incomingQualifiedCount],
    ['成品合格数', qualifiedCount],
    ['不良数量', sumReportRows(rows, (row) => row.defectCount)],
    ['原料不良', sumReportRows(rows, (row) => row.rawMaterialDefectCount)],
    ['加工不良', sumReportRows(rows, (row) => row.processingDefectCount)],
    ['外协不良数', sumReportRows(rows, (row) => row.outsourceDefectCount)],
    ['外协不良原因', joinUniqueText(rows, (row) => row.outsourceDefectReason)],
    ['外协单位', joinUniqueText(rows, (row) => row.outsourceUnit)],
    ['调机不良', sumReportRows(rows, (row) => row.setupDefectCount)],
    ['调机负责人', joinUniqueText(rows, (row) => row.setupResponsible)],
    ['合格率', qualifiedRate],
    [
      '原料不良重量kg',
      sumReportRows(rows, (row) => row.rawMaterialDefectWeightKg),
    ],
    [
      '加工不良重量kg',
      sumReportRows(rows, (row) => row.processingDefectWeightKg),
    ],
    [
      '外协不良重量kg',
      sumReportRows(rows, (row) => row.outsourceDefectWeightKg),
    ],
    ['调机不良重量kg', sumReportRows(rows, (row) => row.setupDefectWeightKg)],
    ['备注', joinUniqueText(rows, (row) => row.remark)],
  ] as const

  return [
    [buildSummaryTitle(rows), '', '', '', ''],
    [...SUMMARY_HEADERS],
    ...summaryRows.map(([label, value], index) => [
      index + 1,
      label,
      value,
      '',
      '',
    ]),
  ]
}

function styleSummaryWorksheet(
  worksheet: XLSX.WorkSheet,
  worksheetData: ReturnType<typeof buildSummaryWorksheetData>,
) {
  worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
  worksheet['!cols'] = [
    { wch: 8, wpx: 76 },
    { wch: 22, wpx: 188 },
    { wch: 32, wpx: 268 },
    { wch: 18, wpx: 156 },
    { wch: 18, wpx: 156 },
  ]
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
    }
  }

  for (let column = 0; column < SUMMARY_HEADERS.length; column += 1) {
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
      }
    }
  }

  for (let row = 1; row < worksheetData.length; row += 1) {
    for (let column = 0; column < SUMMARY_HEADERS.length; column += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: column })

      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          ...(worksheet[cellRef].s || {}),
          alignment: {
            ...(worksheet[cellRef].s?.alignment || {}),
            horizontal: 'center',
            vertical: 'center',
            wrapText: true,
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
  }

  const qualifiedRateCellRef = XLSX.utils.encode_cell({
    r: QUALIFIED_RATE_SUMMARY_ROW_INDEX,
    c: 2,
  })

  if (worksheet[qualifiedRateCellRef]) {
    worksheet[qualifiedRateCellRef].z = '0.00%'
  }

  worksheet['!rows'] ||= []
  worksheet['!rows'][0] = { hpt: 28, hpx: 28 }
}

export function buildProductionDailyReportSummaryWorksheet(
  rows: ProductionDailyReportSummaryRow[],
) {
  const worksheetData = buildSummaryWorksheetData(rows)
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  styleSummaryWorksheet(worksheet, worksheetData)

  return worksheet
}
