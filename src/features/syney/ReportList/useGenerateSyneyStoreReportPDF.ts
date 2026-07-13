import { useState } from 'react'
import { App } from 'antd'
import type jsPDF from 'jspdf'

import { ISyneyItem } from '@services/types'
import { useSelectedReports } from './useSelectedReports'
import { useAppStore } from '@/store'

import { TABLE_CONFIG, TABLE_COLUMNS } from '@/utils/pdfConstants'

type AutoTable = (typeof import('jspdf-autotable'))['default']
type PDFUtils = typeof import('@/utils/pdfUtils')

const loadPDFDependencies = () =>
  Promise.all([import('jspdf-autotable'), import('@/utils/pdfUtils')])

/**
 * 生成单个报告的 PDF 页面
 * @param doc PDF 文档实例
 * @param reportNo 报告编号
 * @param reportData 报告数据
 */
function generateReportPage(
  doc: jsPDF,
  reportNo: string,
  reportData: { items: ISyneyItem[]; totalAmount: number; createdAt: string },
  autoTable: AutoTable,
  pdfUtils: PDFUtils,
) {
  const {
    addDocumentTitle,
    addPageNumber,
    addTableHeader,
    calculateTotals,
    createTableStyles,
    processTableData,
  } = pdfUtils
  const totalPage = Math.ceil(
    (reportData.items.length + 1) / TABLE_CONFIG.ROWS_PER_PAGE,
  )

  // 添加新页面并设置为当前页面
  doc.addPage()
  const currentPageIndex = doc.internal.pages.length - 1
  doc.setPage(currentPageIndex)

  // 处理表格数据（使用优化后的函数）
  const tableData = processTableData(reportData.items)
  const totals = calculateTotals(reportData.items, reportData.totalAmount)
  const body = tableData.concat([totals])

  // 生成表格
  autoTable(doc, {
    head: [Array.from(TABLE_COLUMNS)],
    body,
    ...createTableStyles(),
    willDrawPage: (tableData) => {
      // 添加标题（使用原始的 cursor 偏移方式）
      addDocumentTitle(
        doc,
        '西尼对账单',
        (tableData.cursor?.x ?? 0) + 120,
        (tableData.cursor?.y ?? 0) - 22,
      )

      // 添加表头信息
      addTableHeader(doc, reportNo, reportData.createdAt)
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
 * @param onProgress 进度回调
 */
async function generateAllReports(
  doc: jsPDF,
  selectedMap: Map<
    string,
    { items: ISyneyItem[]; totalAmount: number; createdAt: string }
  >,
  autoTable: AutoTable,
  pdfUtils: PDFUtils,
  onProgress?: (processed: number, total: number) => void,
) {
  const reports = Array.from(selectedMap.entries())
  const { processBatchWithProgress } = pdfUtils

  // 如果数据量很大，使用批次处理
  if (reports.length > 50) {
    await processBatchWithProgress(
      reports,
      10, // 每批处理10个报告
      async (batch) => {
        batch.forEach(([reportNo, data]) => {
          generateReportPage(doc, reportNo, data, autoTable, pdfUtils)
        })
        return []
      },
      onProgress,
    )
  } else {
    // 数据量不大，直接处理但仍有进度回调
    const total = reports.length
    let processed = 0

    for (const [reportNo, data] of reports) {
      generateReportPage(doc, reportNo, data, autoTable, pdfUtils)
      processed++
      onProgress?.(processed, total)

      // 让出控制权
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }
}

export function useGenerateSyneyStoreReportPDF() {
  const tableSelectedKeys = useAppStore((state) => state.tableSelectedKeys)
  const { message } = App.useApp()

  // 只在有选中项时才查询数据
  const { selectedMap, selectedReportsLoading } = useSelectedReports(
    tableSelectedKeys.length > 0,
  )

  const [progress, setProgress] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  function preloadPDF() {
    void loadPDFDependencies()
  }

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

      const [autoTableModule, pdfUtils] = await loadPDFDependencies()
      const autoTable = autoTableModule.default
      const { generateFilename, initializePDF, previewPDF } = pdfUtils

      // 初始化 PDF 文档（异步加载字体）
      const doc = await initializePDF()

      // 生成所有报告页面（带进度回调）
      const reportNos = Array.from(selectedMap.keys())
      await generateAllReports(
        doc,
        selectedMap,
        autoTable,
        pdfUtils,
        (processed, total) => {
          setProgress(Math.round((processed / total) * 100))
          message.loading(`正在生成PDF: ${processed}/${total}`, 0)
        },
      )

      // 删除第一页（空白页）
      doc.deletePage(1)

      // 生成智能文件名
      const filename = generateFilename('detail', selectedMap.size, reportNos)

      // 预览 PDF
      previewPDF(doc, filename)

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
    preloadPDF,
    isLoading: selectedReportsLoading || isGenerating,
    progress,
  }
}
