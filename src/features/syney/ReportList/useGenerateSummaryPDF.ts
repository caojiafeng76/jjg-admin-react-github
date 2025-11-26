import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

import { useSelectedReports } from './useSelectedReports'
import myFont from '@/assets/myFont'
import { formatNumber } from '@/utils/helps'
import { useAppStore } from '@/store'

export function useGenerateSummaryPDF() {
  const { tableSelectedKeys } = useAppStore()

  // 只在有选中项时才查询数据
  const { selectedReportsLoading, selectedMap } = useSelectedReports(
    tableSelectedKeys.length > 0
  )

  function generateSummaryPDF() {
    // 如果数据还在加载，返回 false
    if (selectedReportsLoading) {
      return false
    }

    // 如果没有数据，返回 false
    if (!selectedMap || selectedMap.size === 0) {
      return false
    }

    const doc = new jsPDF({ orientation: 'l' })
    // 设置中文字体
    doc.addFileToVFS('msyh.ttf', myFont)
    doc.addFont('msyh.ttf', 'myFont', 'normal')
    doc.setFont('myFont')

    const arr: { No: string; totalAmount: number }[] = []

    selectedMap?.forEach((data, No) => {
      arr.push({ No, totalAmount: data.totalAmount })
    })

    autoTable(doc, {
      head: [['序号', '入库单号', '金额']],
      body: arr
        ?.map((item, index) => {
          return [index + 1 + '', item.No, formatNumber(item.totalAmount)]
        })
        .concat([
          [
            '*',
            '合计',
            `${formatNumber(arr.map((item) => item.totalAmount).reduce((a, b) => a + b, 0))}`,
          ],
        ]),
      margin: { top: 35 },
      headStyles: { fillColor: '#000', textColor: '#fff' },
      styles: {
        font: 'myFont',
        cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
        halign: 'center',
        valign: 'middle',
      },
      theme: 'grid',
      willDrawPage: (dataOfPage) => {
        doc.setFontSize(20)
        doc.text(
          `对账单【湖州银都铝业科技有限公司】-- ${format(new Date(), 'yyyy-MM-dd')}`,
          (dataOfPage.cursor?.x ?? 0) + 40,
          (dataOfPage.cursor?.y ?? 0) - 22,
        )
      },
    })

    doc.output('dataurlnewwindow', {
      filename: `new`,
    })
    return true // 返回 true 表示生成成功
  }

  return {
    generateSummaryPDF,
    isLoading: selectedReportsLoading,
  }
}
