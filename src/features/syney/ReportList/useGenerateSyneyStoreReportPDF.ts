import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import { ISyneyItem } from '@services/types'
import { useSelectedReports } from './useSelectedReports'
import { useAppStore } from '@/store'

// 导入优化后的工具函数和常量
import {
  initializePDF,
  createTableStyles,
  processTableData,
  calculateTotals,
  addDocumentTitle,
  addPageNumber,
  addTableHeader,
  processBatch,
} from '@/utils/pdfUtils'
import { TABLE_CONFIG, TABLE_COLUMNS } from '@/utils/pdfConstants'

/**
 * 生成单个报告的 PDF 页面
 * @param doc PDF 文档实例
 * @param reportNo 报告编号
 * @param data 报告数据
  */
function generateReportPage(
  doc: jsPDF,
  reportNo: string,
  data: { items: ISyneyItem[]; totalAmount: number; createdAt: string }
) {
  const totalPage = Math.ceil((data.items.length + 1) / TABLE_CONFIG.ROWS_PER_PAGE)

  // 添加新页面并设置为当前页面
  doc.addPage()
  const currentPageIndex = doc.internal.pages.length - 1
  doc.setPage(currentPageIndex)

  // 处理表格数据（使用优化后的函数）
  const tableData = processTableData(data.items)
  const totals = calculateTotals(data.items, data.totalAmount)
  const body = tableData.concat([totals])

  // 生成表格
  autoTable(doc, {
    head: [Array.from(TABLE_COLUMNS)],
    body,
    ...createTableStyles(),
    willDrawPage: (dataOfPage) => {
      // 添加标题
      addDocumentTitle(
        doc,
        '西尼对账单',
        (dataOfPage.cursor?.x ?? 0) + 120,
        (dataOfPage.cursor?.y ?? 0) - 22
      )

      // 添加表头信息
      addTableHeader(doc, reportNo, data.createdAt)
    },
    didDrawPage: (dataOfPage) => {
      // 添加页码
      addPageNumber(doc, dataOfPage.pageNumber, totalPage)
    },
  })
}

/**
 * 批量生成报告（处理大数据量优化）
 * @param doc PDF 文档实例
 * @param selectedMap 选中的报告数据
 */
async function generateAllReports(
  doc: jsPDF,
  selectedMap: Map<string, { items: ISyneyItem[]; totalAmount: number; createdAt: string }>
) {
  const reports = Array.from(selectedMap.entries())

  // 如果数据量很大，使用批次处理
  if (reports.length > 50) {
    await processBatch(
      reports,
      10, // 每批处理10个报告
      async (batch) => {
        batch.forEach(([reportNo, data]) => {
          generateReportPage(doc, reportNo, data)
        })
        return []
      }
    )
  } else {
    // 数据量不大，直接处理
    reports.forEach(([reportNo, data]) => {
      generateReportPage(doc, reportNo, data)
    })
  }
}

export function useGenerateSyneyStoreReportPDF() {
  const { tableSelectedKeys } = useAppStore()

  // 只在有选中项时才查询数据
  const { selectedMap, selectedReportsLoading } = useSelectedReports(
    tableSelectedKeys.length > 0
  )

  async function print() {
    // 如果数据还在加载，返回 false
    if (selectedReportsLoading) {
      console.warn('数据还在加载中，请稍后再试')
      return false
    }

    // 如果没有数据，返回 false
    if (!selectedMap || selectedMap.size === 0) {
      console.warn('没有选中的入库单数据')
      return false
    }

    try {
      // 初始化 PDF 文档（使用优化后的函数）
      const doc = initializePDF()

      // 生成所有报告页面
      await generateAllReports(doc, selectedMap)

      // 删除第一页（空白页）
      doc.deletePage(1)

      // 输出 PDF
      doc.output('dataurlnewwindow', {
        filename: `西尼对账单_${new Date().toISOString().slice(0, 10)}.pdf`,
      })

      return true // 返回 true 表示打印成功
    } catch (error) {
      console.error('生成 PDF 时发生错误:', error)
      return false
    }
  }

  return {
    print,
    isLoading: selectedReportsLoading,
  }
}
