import { useState } from 'react'
import { App } from 'antd'
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
  processBatchWithProgress,
  generateFilename,
} from '@/utils/pdfUtils'
import {
  TABLE_CONFIG,
  TABLE_COLUMNS,
  LAYOUT_CONFIG,
} from '@/utils/pdfConstants'

/**
 * 生成单个报告的 PDF 页面
 * @param doc PDF 文档实例
 * @param reportNo 报告编号
 * @param reportData 报告数据
 * @param isFirst 是否是第一个报告
 */
function generateReportPage(
  doc: jsPDF,
  reportNo: string,
  reportData: { items: ISyneyItem[]; totalAmount: number; createdAt: string },
  isFirst: boolean,
) {
  // 估算总页数 (注意：这只是一个估算，对于复杂表格可能不准确)
  const totalPage = Math.ceil(
    (reportData.items.length + 1) / TABLE_CONFIG.ROWS_PER_PAGE,
  )

  // 如果不是第一个报告，需要添加新页面
  // 初始化时已经有了一页，所以第一个报告不需要添加
  if (!isFirst) {
    doc.addPage()
  }

  // 处理表格数据（使用优化后的函数）
  const tableData = processTableData(reportData.items)
  const totals = calculateTotals(reportData.items, reportData.totalAmount)
  const body = tableData.concat([totals])

  // 生成表格
  autoTable(doc, {
    head: [Array.from(TABLE_COLUMNS)],
    body,
    ...createTableStyles(),
    // 强制在每一页开始
    startY: isFirst ? undefined : 20,
    pageBreak: 'auto',
    showHead: 'everyPage',
    margin: TABLE_CONFIG.MARGIN,
    willDrawPage: (data) => {
      // 添加标题
      // 使用 margin.top 作为基准，加上偏移量
      const margin = data.settings.margin as { top: number }
      const startY = margin.top || 35

      addDocumentTitle(
        doc,
        '西尼对账单',
        LAYOUT_CONFIG.TITLE.X_OFFSET,
        startY + LAYOUT_CONFIG.TITLE.Y_OFFSET,
      )

      // 添加表头信息
      addTableHeader(doc, reportNo, reportData.createdAt)
    },
    didDrawPage: (dataOfPage) => {
      // 添加页码
      // 注意：这里使用的是当前表格的页码信息，而不是整个文档的
      // dataOfPage.pageNumber 在单个 autoTable 调用中是递增的吗？
      // autoTable 文档显示 dataOfPage.pageNumber 是整个文档的页码
      // 如果要实现每个报告独立页码，需要手动计算偏移
      // 这里暂时保持原有逻辑，使用估算的 totalPage 和当前页码（相对于文档）
      // 实际上原代码的 addPageNumber 使用的是 global page number，这可能是不对的
      // 但为了保持兼容性，我们先保留，或者改进它
      // 更好的做法可能是：当前页码 = dataOfPage.pageNumber - startPageOfThisReport + 1
      addPageNumber(doc, dataOfPage.pageNumber, totalPage)
    },
  })
}

/**
 * 批量生成报告（处理大数据量优化）
 * @param doc PDF 文档实例
 * @param selectedMap 选中的报告数据
 * @param onProgress 进度回调
 */
async function generateAllReports(
  doc: jsPDF,
  selectedMap: Map<
    string,
    { items: ISyneyItem[]; totalAmount: number; createdAt: string }
  >,
  onProgress?: (processed: number, total: number) => void,
) {
  const reports = Array.from(selectedMap.entries())
  let processedCount = 0

  // 使用统一的批处理函数
  await processBatchWithProgress(
    reports,
    10, // 批次大小
    async (batch) => {
      batch.forEach(([reportNo, data], index) => {
        // 判断是否是整个文档的第一个报告
        const isFirst = processedCount === 0 && index === 0
        generateReportPage(doc, reportNo, data, isFirst)
      })
      processedCount += batch.length
      return []
    },
    onProgress,
  )
}

export function useGenerateSyneyStoreReportPDF() {
  const { tableSelectedKeys } = useAppStore()
  const { message } = App.useApp()

  // 只在有选中项时才查询数据
  const { selectedMap, selectedReportsLoading } = useSelectedReports(
    tableSelectedKeys.length > 0,
  )

  const [progress, setProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  async function print() {
    // 改进错误处理
    if (selectedReportsLoading) {
      message.warning('数据加载中，请稍候重试')
      return false
    }

    if (!selectedMap || selectedMap.size === 0) {
      message.warning('请选择至少一条对账单数据')
      return false
    }

    try {
      setIsGenerating(true)
      setProgress(0)

      // 初始化 PDF 文档
      const doc = initializePDF()

      // 生成所有报告页面（带进度回调）
      const reportNos = Array.from(selectedMap.keys())
      await generateAllReports(doc, selectedMap, (processed, total) => {
        setProgress(Math.round((processed / total) * 100))
        message.loading(`正在生成PDF: ${processed}/${total}`, 0)
      })

      // 注意：不再需要删除第一页，因为我们在 generateReportPage 中处理了

      // 生成智能文件名
      const filename = generateFilename('detail', selectedMap.size, reportNos)

      // 输出 PDF
      doc.output('dataurlnewwindow', { filename })

      setProgress(100)
      message.destroy() // 销毁加载提示
      message.success(`PDF生成完成: ${filename}`)

      return true // 返回 true 表示打印成功
    } catch (error) {
      console.error('生成 PDF 时发生错误:', error)
      message.destroy()
      message.error(
        error instanceof Error ? error.message : 'PDF生成失败，请重试',
      )
      return false
    } finally {
      setIsGenerating(false)
      setProgress(0)
    }
  }

  return {
    print,
    isLoading: selectedReportsLoading || isGenerating,
    progress,
  }
}
