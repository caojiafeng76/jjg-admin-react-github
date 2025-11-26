import { App } from 'antd'
import autoTable from 'jspdf-autotable'

import { useSelectedReports } from './useSelectedReports'
import { useAppStore } from '@/store'

// 导入优化后的工具函数和常量
import {
  initializePDF,
  createTableStyles,
  generateSummaryTableData,
  generateFilename,
  addPageNumber,
} from '@/utils/pdfUtils'
import { SUMMARY_TABLE_COLUMNS } from '@/utils/pdfConstants'

export function useGenerateSummaryPDF() {
  const { tableSelectedKeys } = useAppStore()
  const { message } = App.useApp()

  // 只在有选中项时才查询数据
  const { selectedReportsLoading, selectedMap } = useSelectedReports(
    tableSelectedKeys.length > 0
  )

  function generateSummaryPDF() {
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
      // 初始化 PDF 文档
      const doc = initializePDF()

      // 准备汇总数据
      const summaryData = Array.from(selectedMap.entries()).map(([No, data]) => ({
        No,
        totalAmount: data.totalAmount,
      }))

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
          const date = new Date().toLocaleDateString('zh-CN')
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

      // 输出 PDF
      doc.output('dataurlnewwindow', { filename })

      message.success(`PDF生成完成: ${filename}`)
      return true // 返回 true 表示生成成功
    } catch (error) {
      console.error('生成汇总 PDF 时发生错误:', error)
      message.error(error instanceof Error ? error.message : 'PDF生成失败，请重试')
      return false
    }
  }

  return {
    generateSummaryPDF,
    isLoading: selectedReportsLoading,
  }
}
