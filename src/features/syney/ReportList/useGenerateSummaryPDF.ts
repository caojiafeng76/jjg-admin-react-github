import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

import { useSelectedReports } from './useSelectedReports'
import { useAppStore } from '@/store'

// 导入优化后的工具函数和常量
import {
  initializePDF,
  createTableStyles,
  generateSummaryTableData,
  addDocumentTitle,
} from '@/utils/pdfUtils'
import { SUMMARY_TABLE_COLUMNS } from '@/utils/pdfConstants'

export function useGenerateSummaryPDF() {
  const { tableSelectedKeys } = useAppStore()

  // 只在有选中项时才查询数据
  const { selectedReportsLoading, selectedMap } = useSelectedReports(
    tableSelectedKeys.length > 0
  )

  function generateSummaryPDF() {
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
        willDrawPage: (dataOfPage) => {
          // 添加标题
          const title = `对账单【湖州银都铝业科技有限公司】-- ${format(
            new Date(),
            'yyyy-MM-dd'
          )}`
          addDocumentTitle(
            doc,
            title,
            (dataOfPage.cursor?.x ?? 0) + 40,
            (dataOfPage.cursor?.y ?? 0) - 22
          )
        },
      })

      // 输出 PDF
      doc.output('dataurlnewwindow', {
        filename: `对账单汇总_${new Date().toISOString().slice(0, 10)}.pdf`,
      })

      return true // 返回 true 表示生成成功
    } catch (error) {
      console.error('生成汇总 PDF 时发生错误:', error)
      return false
    }
  }

  return {
    generateSummaryPDF,
    isLoading: selectedReportsLoading,
  }
}
