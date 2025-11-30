/**
 * PDF 生成工具函数
 * 提供通用的 PDF 处理功能，减少代码重复
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import myFont from '@/assets/myFont'

import {
  FONT_CONFIG,
  TABLE_CONFIG,
  LAYOUT_CONFIG,
  CACHE_CONFIG,
  FILENAME_CONFIG,
} from './pdfConstants'
import { formatNumber } from './helps'
import { ISyneyItem } from '@services/types'

/**
 * 初始化 PDF 文档
 * @param orientation 页面方向，默认横向
 * @returns 初始化后的 jsPDF 实例
 */
export function initializePDF(orientation: 'p' | 'l' = 'l') {
  const doc = new jsPDF({ orientation })

  // 设置中文字体
  doc.addFileToVFS(FONT_CONFIG.FONT_NAME, myFont)
  doc.addFont(FONT_CONFIG.FONT_NAME, FONT_CONFIG.FONT_FAMILY, FONT_CONFIG.FONT_STYLE)
  doc.setFont(FONT_CONFIG.FONT_FAMILY)

  return doc
}

/**
 * 创建标准表格样式
 * @returns 表格样式配置对象
 */
export function createTableStyles() {
  return {
    headStyles: TABLE_CONFIG.HEAD_STYLES,
    styles: TABLE_CONFIG.STYLES,
    theme: TABLE_CONFIG.THEME,
    margin: TABLE_CONFIG.MARGIN,
  }
}

/**
 * 格式化数字（带缓存）
 * @param number 要格式化的数字
 * @returns 格式化后的字符串
 */
export function formatNumberWithCache(number: number): string {
  const key = number.toString()

  // 检查缓存
  if (CACHE_CONFIG.FORMATTED_NUMBERS.has(key)) {
    return CACHE_CONFIG.FORMATTED_NUMBERS.get(key)!
  }

  // 计算并缓存
  const formatted = formatNumber(number)

  // 清理缓存（如果超过阈值）
  if (CACHE_CONFIG.FORMATTED_NUMBERS.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
    const entries = Array.from(CACHE_CONFIG.FORMATTED_NUMBERS.entries())
    // 保留最近的一半
    const keepEntries = entries.slice(-CACHE_CONFIG.CACHE_CLEANUP_THRESHOLD)
    CACHE_CONFIG.FORMATTED_NUMBERS.clear()
    keepEntries.forEach(([k, v]) => CACHE_CONFIG.FORMATTED_NUMBERS.set(k, v))
  }

  CACHE_CONFIG.FORMATTED_NUMBERS.set(key, formatted)
  return formatted
}

/**
 * 处理并排序表格数据
 * @param items 原始项目数据
 * @returns 处理后的表格行数据
 */
export function processTableData(items: ISyneyItem[]): string[][] {
  // 先排序，再映射，避免多次遍历
  return items
    .sort((a, b) => a.PartNo?.localeCompare(b.PartNo!) || 0)
    .map((item: ISyneyItem, index: number) => [
      (index + 1).toString(),
      item.PartNo || '',
      item.PartName || '',
      item.Spec || '',
      item.ParamSpec || '',
      item.Unit || '',
      formatNumberWithCache(item.TaxUnitPrice || 0),
      (item.Qty || 0).toString(),
      formatNumberWithCache(item.TaxTotalPrice || 0),
    ])
}

/**
 * 计算表格总计行
 * @param items 原始项目数据
 * @param totalAmount 总金额
 * @returns 总计行数据
 */
export function calculateTotals(items: ISyneyItem[], totalAmount?: number): string[] {
  const totalQty = items.reduce((sum, item) => (sum || 0) + (item.Qty || 0), 0)

  return [
    '*',
    '合计',
    '',
    '',
    '',
    '',
    '',
    totalQty.toString(),
    formatNumberWithCache(totalAmount || 0),
  ]
}

/**
 * 生成文档标题
 * @param doc PDF 文档实例
 * @param title 标题文本
 * @param x X 坐标偏移
 * @param y Y 坐标偏移
 */
export function addDocumentTitle(
  doc: jsPDF,
  title: string,
  x: number = LAYOUT_CONFIG.TITLE.X_OFFSET,
  y: number = LAYOUT_CONFIG.TITLE.Y_OFFSET
) {
  doc.setFontSize(LAYOUT_CONFIG.TITLE.FONT_SIZE)
  doc.text(title, x, y)
}

/**
 * 生成页码信息
 * @param doc PDF 文档实例
 * @param currentPage 当前页码
 * @param totalPages 总页数
 */
export function addPageNumber(doc: jsPDF, currentPage: number, totalPages: number) {
  const text = `第${currentPage}页，共${totalPages}页`
  const pageSize = doc.internal.pageSize
  const pageWidth =
    typeof pageSize.getWidth === 'function' ? pageSize.getWidth() : pageSize.width
  const pageHeight =
    typeof pageSize.getHeight === 'function' ? pageSize.getHeight() : pageSize.height
  const { X_OFFSET = -150, Y_OFFSET = 10 } = LAYOUT_CONFIG.PAGE_NUMBER

  const x = pageWidth + X_OFFSET
  const y = pageHeight - Y_OFFSET

  doc.text(text, x, y, { align: 'center' })
}

/**
 * 生成智能文件名
 * @param type 文件类型 ('detail' | 'summary')
 * @param count 数据条数
 * @param reportNos 对账单号列表（可选）
 * @returns 生成的文件名
 */
export function generateFilename(
  type: 'detail' | 'summary',
  count: number,
  reportNos?: string[]
): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const prefix = FILENAME_CONFIG.PREFIX[type.toUpperCase() as 'DETAIL' | 'SUMMARY'] || FILENAME_CONFIG.PREFIX.SUMMARY
  const suffix = FILENAME_CONFIG.SUFFIX

  if (type === 'detail' && reportNos && reportNos.length > 0) {
    // 详细对账单：包含对账单号
    const reportNoStr = reportNos.length === 1
      ? reportNos[0]
      : `${reportNos.length}条记录`
    return `${prefix}_${reportNoStr}_${timestamp}${suffix}`
  } else {
    // 汇总表：包含数量
    return `${prefix}_${count}条_${timestamp}${suffix}`
  }
}

/**
 * 带进度回调的批次处理
 * @param array 要处理的数组
 * @param batchSize 批次大小
 * @param processor 处理函数
 * @param onProgress 进度回调函数
 */
export async function processBatchWithProgress<T, R>(
  array: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = []
  const total = array.length
  let processed = 0

  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize)
    const batchResults = await processor(batch)
    results.push(...batchResults)

    processed += batch.length
    onProgress?.(processed, total)

    // 让出控制权，避免阻塞UI
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  return results
}

/**
 * 在新窗口中打开 PDF
 * @param doc PDF 文档实例
 */
export function openPDFInNewWindow(doc: jsPDF) {
  window.open(doc.output('bloburl'), '_blank')
}

/**
 * 生成表格表头信息
 * @param doc PDF 文档实例
 * @param reportNo 报告编号
 * @param createdAt 创建时间
 */
export function addTableHeader(doc: jsPDF, reportNo: string, createdAt: string) {
  autoTable(doc, {
    margin: LAYOUT_CONFIG.HEADER_INFO.MARGIN,
    styles: TABLE_CONFIG.STYLES,
    theme: 'plain',
    headStyles: TABLE_CONFIG.HEAD_STYLES,
    head: LAYOUT_CONFIG.HEADER_INFO.HEAD,
    body: [[reportNo, format(new Date(createdAt), 'yyyy-MM-dd')]],
  })
}

/**
 * 生成汇总表格数据
 * @param data 汇总数据数组
 * @returns 表格数据
 */
export function generateSummaryTableData(data: Array<{ No: string; totalAmount: number }>) {
  const totalAmount = data.reduce((sum, item) => sum + item.totalAmount, 0)

  return data
    .map((item, index) => [
      (index + 1).toString(),
      item.No,
      formatNumberWithCache(item.totalAmount),
    ])
    .concat([
      ['*', '合计', formatNumberWithCache(totalAmount)],
    ])
}

/**
 * 批量处理大数据量
 * @param array 要处理的数组
 * @param batchSize 批次大小
 * @param processor 处理函数
 */
export async function processBatch<T, R>(
  array: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < array.length; i += batchSize) {
    const batch = array.slice(i, i + batchSize)
    const batchResults = await processor(batch)
    results.push(...batchResults)

    // 让出控制权，避免阻塞UI
    await new Promise(resolve => setTimeout(resolve, 0))
  }

  return results
}
