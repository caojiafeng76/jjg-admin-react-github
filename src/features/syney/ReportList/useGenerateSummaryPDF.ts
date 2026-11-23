import { App } from 'antd'
import { useState } from 'react'

import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { formatDate } from '@/utils/format'
import { SUMMARY_TABLE_COLUMNS } from '@/utils/pdfConstants'
import { useTableSelection } from '../useTableSelection'
import { useFetchSelectedReports } from './useFetchSelectedReports'

function loadPDFDependencies() {
  return Promise.all([import('jspdf-autotable'), import('@/utils/pdfUtils')])
}

export function useGenerateSummaryPDF() {
  const { tableSelectedKeys } = useTableSelection()
  const { fetchSelectedReports } = useFetchSelectedReports()
  const { message } = App.useApp()
  const [isGenerating, setIsGenerating] = useState(false)

  function preloadPDF() {
    void loadPDFDependencies()
  }

  async function generateSummaryPDF() {
    if (isGenerating) {
      message.warning('对账单数据加载中，请稍后再试')
      return false
    }

    if (tableSelectedKeys.length === 0) {
      message.warning(feedbackText.selectRequired('打印'))
      return false
    }

    try {
      setIsGenerating(true)
      const selectedMap = await fetchSelectedReports()

      if (selectedMap.size === 0) {
        message.warning(feedbackText.selectRequired('打印'))
        return false
      }

      const [autoTableModule, pdfUtils] = await loadPDFDependencies()
      const autoTable = autoTableModule.default
      const {
        initializePDF,
        createTableStyles,
        generateSummaryTableData,
        generateFilename,
        addPageNumber,
        previewPDF,
      } = pdfUtils

      // 初始化 PDF 文档（异步加载字体）
      const doc = await initializePDF()

      // 准备汇总数据
      const summaryData = Array.from(selectedMap.entries()).map(
        ([No, data]) => ({
          No,
          totalAmount: data.totalAmount,
        }),
      )

      // 生成表格数据（使用优化后的函数）
      const tableData = generateSummaryTableData(summaryData)

      // 生成表格
      autoTable(doc, {
        head: [Array.from(SUMMARY_TABLE_COLUMNS)],
        body: tableData,
        ...createTableStyles(),
        startY: 30,
        willDrawPage: () => {
          // 添加标题
          const date = formatDate(new Date())
          const title = `对账单【湖州银都铝业科技有限公司】-- ${date}`

          doc.setFontSize(16)
          doc.text(title, 105, 20, { align: 'center' })
        },
        didDrawPage: (dataOfPage) => {
          // 使用工具函数添加页码
          const pageCount = doc.getNumberOfPages()
          addPageNumber(doc, dataOfPage.pageNumber, pageCount)
        },
      })

      // 生成智能文件名
      const filename = generateFilename('summary', selectedMap.size)

      // 预览 PDF
      previewPDF(doc, filename)

      message.success('汇总单 PDF 已生成')
      return true
    }
    catch (error) {
      console.error('生成汇总 PDF 时发生错误:', error)
      message.error(
        getUserErrorMessage(error, feedbackText.failed('生成', '汇总单 PDF')),
      )
      return false
    }
    finally {
      setIsGenerating(false)
    }
  }

  return {
    generateSummaryPDF,
    preloadPDF,
    isLoading: isGenerating,
  }
}
