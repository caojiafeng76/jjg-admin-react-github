import dayjs from 'dayjs'
import jsPDF from 'jspdf'

import type { ISyneyItem } from '@services/types'

import { GOOGLE_FONT_CONFIG, loadGoogleFont } from './googleFontLoader'
import { printPDF } from './pdfUtils'

const ITEMS_PER_PAGE = 11
const POINT_TO_MM = 0.352778
const TEXT_PADDING_X = 1.2
const TEXT_PADDING_Y = 0.8

type FontStyle = 'normal' | 'bold'
type TextAlign = 'left' | 'center' | 'right'

export interface SyneyStoreReceiptItem extends ISyneyItem {
  ID?: number | null
  Address?: string | null
  CreateOn?: string | null
  DeliveryOrderNo?: string | null
  SupplierCode?: string | null
  SupplierName?: string | null
}

export interface SyneyStoreReceiptReport {
  No: string
  CreateOn: string
  SupplierName: string
  DeliveryOrderNos: string[]
  items: SyneyStoreReceiptItem[]
}

export interface SyneyStoreReceiptPage {
  items: SyneyStoreReceiptItem[]
  pageNumber: number
  rowStartIndex: number
  totalPages: number
}

export interface SyneyStoreReceiptPdfLayout {
  companyNameX: number
  headerHeight: number
  infoBoxHeight: number
  infoBoxRowHeight: number
  infoBoxTop: number
  logoHeight: number
  logoPath: string
  logoWidth: number
  logoX: number
  logoY: number
  pageMargin: number
  receiptTitleX: number
  tableHeaderHeight: number
  tableRowHeight: number
  tableTop: number
}

interface TableColumn {
  align: TextAlign
  header: string
  ratio: number
  value: (
    item: SyneyStoreReceiptItem,
    rowIndex: number,
  ) => string | number | null | undefined
}

interface TextBoxOptions {
  align: TextAlign
  fontSize: number
  fontStyle?: FontStyle
  height: number
  maxLines?: number
  width: number
  x: number
  y: number
}

const TABLE_COLUMNS: TableColumn[] = [
  {
    align: 'center',
    header: '定位行',
    ratio: 24,
    value: (_item, rowIndex) => rowIndex + 1,
  },
  {
    align: 'left',
    header: '物料件号',
    ratio: 55,
    value: (item) => item.PartNo,
  },
  {
    align: 'left',
    header: '物料名称',
    ratio: 55,
    value: (item) => item.PartName,
  },
  {
    align: 'left',
    header: '规格',
    ratio: 60,
    value: (item) => item.Spec,
  },
  {
    align: 'left',
    header: '参数规格',
    ratio: 55,
    value: (item) => item.ParamSpec,
  },
  {
    align: 'center',
    header: '单位',
    ratio: 24,
    value: (item) => item.Unit,
  },
  {
    align: 'center',
    header: '数量',
    ratio: 24,
    value: (item) => item.Qty,
  },
  {
    align: 'left',
    header: '席位',
    ratio: 55,
    value: (item) => item.Address,
  },
  {
    align: 'left',
    header: '备注',
    ratio: 100,
    value: (item) => item.Remark,
  },
]

const LAYOUT = getSyneyStoreReceiptPdfLayout()
const PAGE_MARGIN = LAYOUT.pageMargin
const HEADER_HEIGHT = LAYOUT.headerHeight
const INFO_BOX_HEIGHT = LAYOUT.infoBoxHeight
const INFO_BOX_ROW_HEIGHT = LAYOUT.infoBoxRowHeight
const TABLE_TOP = LAYOUT.tableTop
const TABLE_HEADER_HEIGHT = LAYOUT.tableHeaderHeight
const TABLE_ROW_HEIGHT = LAYOUT.tableRowHeight

let logoDataUrlPromise: Promise<string | null> | null = null

export function getSyneyStoreReceiptPdfLayout(): SyneyStoreReceiptPdfLayout {
  const pageMargin = 2
  const headerHeight = 18
  const infoBoxTop = headerHeight + 4
  const infoBoxHeight = 14

  return {
    companyNameX: 98,
    headerHeight,
    infoBoxHeight,
    infoBoxRowHeight: 8,
    infoBoxTop,
    logoHeight: 12,
    logoPath: '/syney-logo.png',
    logoWidth: 82.5,
    logoX: pageMargin,
    logoY: 2,
    pageMargin,
    receiptTitleX: 122,
    tableHeaderHeight: 8,
    tableRowHeight: 8,
    tableTop: infoBoxTop + infoBoxHeight,
  }
}

export function buildSyneyStoreReceiptReport(
  items: SyneyStoreReceiptItem[],
): SyneyStoreReceiptReport {
  const firstItem = items[0]
  const supplierName = firstItem
    ? buildSupplierName(firstItem.SupplierName, firstItem.SupplierCode)
    : ''
  const deliveryOrderNos = Array.from(
    new Set(
      items
        .map((item) => item.DeliveryOrderNo?.trim() || '')
        .filter(Boolean),
    ),
  )

  return {
    No: firstItem?.No || '',
    CreateOn: firstItem?.CreateOn || '',
    SupplierName: supplierName,
    DeliveryOrderNos: deliveryOrderNos,
    items,
  }
}

export function buildSyneyStoreReceiptPages(
  report: Pick<SyneyStoreReceiptReport, 'items'>,
  itemsPerPage: number,
): SyneyStoreReceiptPage[] {
  const items = report.items ?? []
  const pageSize = Math.max(1, Math.floor(itemsPerPage))
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  return Array.from({ length: totalPages }, (_, pageIndex) => ({
    items: items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    pageNumber: pageIndex + 1,
    rowStartIndex: pageIndex * pageSize,
    totalPages,
  }))
}

export function formatSyneyStoreReceiptDate(
  value: string | null | undefined,
): string {
  return value ? dayjs(value).format('YYYY/MM/DD') : ''
}

export function toReceiptDisplayText(
  value: string | number | null | undefined,
): string {
  return value === null || value === undefined ? '' : String(value)
}

export async function createSyneyStoreReceiptPdf(
  report: SyneyStoreReceiptReport,
): Promise<jsPDF> {
  const doc = new jsPDF({
    compress: true,
    format: 'a5',
    orientation: 'l',
    putOnlyUsedFonts: true,
    unit: 'mm',
  })

  await registerChineseFont(doc)
  const logoDataUrl = await loadLogoDataUrl()
  drawReport(doc, report, logoDataUrl)

  return doc
}

export async function printSyneyStoreReceipt(
  report: SyneyStoreReceiptReport,
  targetWindow?: Window | null,
): Promise<boolean> {
  const doc = await createSyneyStoreReceiptPdf(report)
  const filename = `${toReceiptDisplayText(report.No) || '入库单'}.pdf`

  return printPDF(doc, filename, targetWindow)
}

function buildSupplierName(
  supplierName: string | null | undefined,
  supplierCode: string | null | undefined,
): string {
  const name = supplierName?.trim() || ''
  const code = supplierCode?.trim() || ''

  if (name && code) {
    return `${name}(${code})`
  }

  return name || code
}

async function registerChineseFont(doc: jsPDF): Promise<void> {
  const fontData = await loadGoogleFont()

  doc.addFileToVFS(GOOGLE_FONT_CONFIG.FONT_NAME, fontData)
  doc.addFont(
    GOOGLE_FONT_CONFIG.FONT_NAME,
    GOOGLE_FONT_CONFIG.FONT_FAMILY,
    'normal',
  )
  doc.addFont(
    GOOGLE_FONT_CONFIG.FONT_NAME,
    GOOGLE_FONT_CONFIG.FONT_FAMILY,
    'bold',
  )
  doc.setFont(GOOGLE_FONT_CONFIG.FONT_FAMILY, 'normal')
}

async function loadLogoDataUrl(): Promise<string | null> {
  logoDataUrlPromise ??= fetch(LAYOUT.logoPath)
    .then(async (response) => {
      if (!response.ok) {
        return null
      }

      const buffer = await response.arrayBuffer()
      return `data:image/png;base64,${arrayBufferToBase64(buffer)}`
    })
    .catch(() => null)

  return logoDataUrlPromise
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

function drawReport(
  doc: jsPDF,
  report: SyneyStoreReceiptReport,
  logoDataUrl: string | null,
): void {
  const pages = buildSyneyStoreReceiptPages(report, ITEMS_PER_PAGE)

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage()
    }

    drawPage(doc, report, page, logoDataUrl)
  })
}

function drawPage(
  doc: jsPDF,
  report: SyneyStoreReceiptReport,
  page: SyneyStoreReceiptPage,
  logoDataUrl: string | null,
): void {
  doc.setDrawColor(0)
  doc.setTextColor(0)
  doc.setLineWidth(0.15)
  drawHeader(doc, logoDataUrl)
  drawInfoBox(doc, report)
  drawTable(doc, page)
  drawFooter(doc, page)
}

function drawHeader(doc: jsPDF, logoDataUrl: string | null): void {
  if (logoDataUrl) {
    doc.addImage(
      logoDataUrl,
      'PNG',
      LAYOUT.logoX,
      LAYOUT.logoY,
      LAYOUT.logoWidth,
      LAYOUT.logoHeight,
    )
  }

  doc.setFont(GOOGLE_FONT_CONFIG.FONT_FAMILY, 'bold')
  doc.setFontSize(15)
  doc.text('西尼电梯（杭州）有限公司', LAYOUT.companyNameX, 9)
  doc.text('入库单', LAYOUT.receiptTitleX, HEADER_HEIGHT - 3)
}

function drawInfoBox(
  doc: jsPDF,
  report: SyneyStoreReceiptReport,
): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const width = pageWidth - PAGE_MARGIN * 2
  const top = LAYOUT.infoBoxTop
  const contentTop = top + INFO_BOX_ROW_HEIGHT
  const deliveryOrderNos = report.DeliveryOrderNos.join(',')

  doc.rect(PAGE_MARGIN, top, width, INFO_BOX_HEIGHT)
  doc.line(
    PAGE_MARGIN,
    top + INFO_BOX_ROW_HEIGHT,
    PAGE_MARGIN + width,
    top + INFO_BOX_ROW_HEIGHT,
  )

  drawTextBlock(doc, `供应商名称：${report.SupplierName}`, {
    align: 'left',
    fontSize: 7,
    height: INFO_BOX_ROW_HEIGHT,
    maxLines: 1,
    width: 78,
    x: PAGE_MARGIN + 2,
    y: top,
  })
  drawTextBlock(doc, `入库单号：${report.No}`, {
    align: 'left',
    fontSize: 7,
    height: INFO_BOX_ROW_HEIGHT,
    maxLines: 1,
    width: 52,
    x: PAGE_MARGIN + 86,
    y: top,
  })
  drawTextBlock(
    doc,
    `入库日期：${formatSyneyStoreReceiptDate(report.CreateOn)}`,
    {
      align: 'left',
      fontSize: 7,
      height: INFO_BOX_ROW_HEIGHT,
      maxLines: 1,
      width: 56,
      x: PAGE_MARGIN + 145,
      y: top,
    },
  )
  drawTextBlock(doc, `采购单号：${deliveryOrderNos}`, {
    align: 'left',
    fontSize: 7,
    height: INFO_BOX_HEIGHT - INFO_BOX_ROW_HEIGHT,
    maxLines: 1,
    width: width - 4,
    x: PAGE_MARGIN + 2,
    y: contentTop,
  })
}

function drawTable(doc: jsPDF, page: SyneyStoreReceiptPage): void {
  const columnWidths = getColumnWidths(doc)
  let x = PAGE_MARGIN

  TABLE_COLUMNS.forEach((column, columnIndex) => {
    drawCell(doc, column.header, {
      align: 'center',
      fontSize: 7,
      fontStyle: 'bold',
      height: TABLE_HEADER_HEIGHT,
      width: columnWidths[columnIndex],
      x,
      y: TABLE_TOP,
    })
    x += columnWidths[columnIndex]
  })

  page.items.forEach((item, rowIndex) => {
    const y = TABLE_TOP + TABLE_HEADER_HEIGHT + rowIndex * TABLE_ROW_HEIGHT
    const globalRowIndex = page.rowStartIndex + rowIndex
    let cellX = PAGE_MARGIN

    TABLE_COLUMNS.forEach((column, columnIndex) => {
      drawCell(doc, column.value(item, globalRowIndex), {
        align: column.align,
        fontSize: 7,
        fontStyle: 'normal',
        height: TABLE_ROW_HEIGHT,
        width: columnWidths[columnIndex],
        x: cellX,
        y,
      })
      cellX += columnWidths[columnIndex]
    })
  })
}

function drawFooter(doc: jsPDF, page: SyneyStoreReceiptPage): void {
  const pageWidth = doc.internal.pageSize.getWidth()
  const footerY =
    TABLE_TOP +
    TABLE_HEADER_HEIGHT +
    page.items.length * TABLE_ROW_HEIGHT +
    5

  drawTextBlock(doc, '制单人', {
    align: 'left',
    fontSize: 7,
    height: 4,
    maxLines: 1,
    width: 30,
    x: PAGE_MARGIN,
    y: footerY - 3,
  })
  drawTextBlock(doc, `${page.pageNumber}/${page.totalPages}页`, {
    align: 'right',
    fontSize: 7,
    height: 4,
    maxLines: 1,
    width: 30,
    x: pageWidth - PAGE_MARGIN - 30,
    y: footerY - 3,
  })
}

function getColumnWidths(doc: jsPDF): number[] {
  const contentWidth = doc.internal.pageSize.getWidth() - PAGE_MARGIN * 2
  const ratioTotal = TABLE_COLUMNS.reduce(
    (total, column) => total + column.ratio,
    0,
  )
  let usedWidth = 0

  return TABLE_COLUMNS.map((column, index) => {
    if (index === TABLE_COLUMNS.length - 1) {
      return contentWidth - usedWidth
    }

    const width = (contentWidth * column.ratio) / ratioTotal
    usedWidth += width
    return width
  })
}

function drawCell(
  doc: jsPDF,
  value: string | number | null | undefined,
  options: TextBoxOptions,
): void {
  doc.rect(options.x, options.y, options.width, options.height)
  drawTextBlock(doc, value, options)
}

function drawTextBlock(
  doc: jsPDF,
  value: string | number | null | undefined,
  options: TextBoxOptions,
): void {
  const text = toReceiptDisplayText(value)

  if (!text) {
    return
  }

  const fontSize = options.fontSize
  const lineHeight = fontSize * POINT_TO_MM * 1.2
  const width = Math.max(1, options.width - TEXT_PADDING_X * 2)
  const availableHeight = Math.max(1, options.height - TEXT_PADDING_Y * 2)
  const maxLines =
    options.maxLines ?? Math.max(1, Math.floor(availableHeight / lineHeight))

  doc.setFont(GOOGLE_FONT_CONFIG.FONT_FAMILY, options.fontStyle ?? 'normal')
  doc.setFontSize(fontSize)

  const lines = fitLines(
    doc,
    doc.splitTextToSize(text, width),
    width,
    maxLines,
  )
  const textBlockHeight = lineHeight * lines.length
  const baselineOffset = fontSize * POINT_TO_MM * 0.8
  const firstBaseline =
    options.y + (options.height - textBlockHeight) / 2 + baselineOffset
  const x = getTextX(options)

  lines.forEach((line, lineIndex) => {
    doc.text(line, x, firstBaseline + lineIndex * lineHeight, {
      align: options.align,
      maxWidth: width,
    })
  })
}

function getTextX(options: TextBoxOptions): number {
  if (options.align === 'center') {
    return options.x + options.width / 2
  }

  if (options.align === 'right') {
    return options.x + options.width - TEXT_PADDING_X
  }

  return options.x + TEXT_PADDING_X
}

function fitLines(
  doc: jsPDF,
  inputLines: string[],
  maxWidth: number,
  maxLines: number,
): string[] {
  if (inputLines.length <= maxLines) {
    return inputLines
  }

  const lines = inputLines.slice(0, maxLines)
  const lastLine = lines[lines.length - 1]
  lines[lines.length - 1] = trimTextToWidth(doc, lastLine, maxWidth)
  return lines
}

function trimTextToWidth(doc: jsPDF, text: string, maxWidth: number): string {
  const suffix = '...'
  let value = text

  while (value && doc.getTextWidth(`${value}${suffix}`) > maxWidth) {
    value = value.slice(0, -1)
  }

  return value ? `${value}${suffix}` : suffix
}
