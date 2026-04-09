import type { WorkSheet } from 'xlsx-js-style'

export const EXCEL_WRITE_OPTIONS = {
  cellStyles: true,
}

function getTextDisplayWidth(text: string): number {
  return text.split(/\r?\n/).reduce((maxWidth, line) => {
    let width = 0

    for (let index = 0; index < line.length; index++) {
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

/**
 * 自动调整工作表列宽
 * @param ws 工作表对象
 * @param data 二维数组数据（第一行为表头）
 * @param minWidth 最小列宽（字符数）
 * @param maxWidth 最大列宽（字符数）
 */
export function autoFitColumnWidths(
  ws: WorkSheet,
  data: Array<Array<string | number | null | undefined>>,
  minWidth = 8,
  maxWidth = 60,
) {
  if (!data || data.length === 0) return

  const colCount = data[0].length
  const colWidths: { wch: number; wpx: number }[] = []

  for (let col = 0; col < colCount; col++) {
    let maxLen = minWidth
    for (let row = 0; row < data.length; row++) {
      const cell = data[row][col]
      if (cell !== null && cell !== undefined) {
        const len = getTextDisplayWidth(String(cell))
        if (len > maxLen) {
          maxLen = len
        }
      }
    }

    // 为宋体和 Excel 单元格留出更宽松的左右空白，避免视觉上仍然被截断
    const width = Math.min(Math.max(maxLen + 4, minWidth), maxWidth)
    colWidths.push({
      wch: width,
      wpx: Math.round(width * 8 + 12),
    })
  }

  ws['!cols'] = colWidths
}

export function setColumnWidths(ws: WorkSheet, widths: number[]) {
  ws['!cols'] = widths.map((width) => ({
    wch: width,
    wpx: Math.round(width * 8 + 12),
  }))
}

/**
 * 设置工作表行高
 * @param ws 工作表对象
 * @param rowHeight 行高（点数）
 * @param rowCount 总行数（包括表头）
 */
export function setRowHeight(
  ws: WorkSheet,
  rowHeight: number,
  rowCount: number,
) {
  const rows: { hpt?: number; hpx?: number }[] = []
  for (let i = 0; i < rowCount; i++) {
    // 同时设置 hpt（点）和 hpx（像素），以兼容不同版本
    rows.push({ hpt: rowHeight, hpx: rowHeight })
  }
  ws['!rows'] = rows
}

/**
 * 将列索引转换为 Excel 列字母（0 -> A, 1 -> B, ...）
 */
function columnIndexToLetter(index: number): string {
  let letter = ''
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter
    index = Math.floor(index / 26) - 1
  }
  return letter
}

/**
 * 设置工作表中所有单元格内容居中（水平和垂直居中）
 * @param ws 工作表对象
 * @param data 二维数组数据（用于确定范围）
 */
export function centerAllCells(ws: WorkSheet, data: Array<Array<unknown>>) {
  if (!data || data.length === 0) return

  const rowCount = data.length
  const colCount = data[0].length

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      const cellRef = `${columnIndexToLetter(col)}${row + 1}`
      // 如果单元格不存在，创建一个空对象
      if (!ws[cellRef]) {
        ws[cellRef] = { v: '' }
      }
      // 合并已有样式，避免覆盖其他格式
      ws[cellRef].s = {
        ...(ws[cellRef].s || {}),
        font: {
          ...(ws[cellRef].s?.font || {}),
          name: '宋体',
          sz: 11,
        },
        alignment: {
          ...(ws[cellRef].s?.alignment || {}),
          horizontal: 'center',
          vertical: 'center',
        },
      }
    }
  }
}

interface RegisterSheetStyleOptions {
  columnWidths?: number[]
  titleRowHeight?: number
  headerRowHeight?: number
  bodyRowHeight?: number
  freezeYSplit?: number
}

export function applyRegisterSheetStyles(
  ws: WorkSheet,
  data: Array<Array<string | number | null | undefined>>,
  options: RegisterSheetStyleOptions = {},
) {
  if (!data || data.length === 0) return

  const {
    columnWidths,
    titleRowHeight = 34,
    headerRowHeight = 28,
    bodyRowHeight = 26,
    freezeYSplit = 2,
  } = options

  if (columnWidths?.length) {
    setColumnWidths(ws, columnWidths)
  } else {
    autoFitColumnWidths(ws, data)
  }

  const rowCount = data.length
  const colCount = data[0].length
  const borderColor = '000000'

  if (!ws['!rows']) {
    ws['!rows'] = []
  }

  ws['!rows'][0] = { hpt: titleRowHeight, hpx: titleRowHeight }
  ws['!rows'][1] = { hpt: headerRowHeight, hpx: headerRowHeight }

  for (let row = 2; row < rowCount; row += 1) {
    ws['!rows'][row] = { hpt: bodyRowHeight, hpx: bodyRowHeight }
  }

  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < colCount; col += 1) {
      const cellRef = `${columnIndexToLetter(col)}${row + 1}`

      if (!ws[cellRef]) {
        ws[cellRef] = { v: '' }
      }

      const baseStyle = {
        font: {
          ...(ws[cellRef].s?.font || {}),
          name: '宋体',
          sz: row === 0 ? 16 : row === 1 ? 11 : 10.5,
          bold: row <= 1,
        },
        alignment: {
          ...(ws[cellRef].s?.alignment || {}),
          horizontal: 'center',
          vertical: 'center',
          wrapText: true,
        },
        fill: {
          fgColor: {
            rgb: row === 1 ? 'D8E4F1' : 'FFFFFF',
          },
        },
        border: {
          top: { style: 'thin', color: { rgb: borderColor } },
          bottom: { style: 'thin', color: { rgb: borderColor } },
          left: { style: 'thin', color: { rgb: borderColor } },
          right: { style: 'thin', color: { rgb: borderColor } },
        },
      }

      ws[cellRef].s = {
        ...(ws[cellRef].s || {}),
        ...baseStyle,
      }
    }
  }

  ws['!freeze'] = { xSplit: 0, ySplit: freezeYSplit }
}
