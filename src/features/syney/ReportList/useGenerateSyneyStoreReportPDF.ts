import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

import { ISyneyItem } from '@/types'
import { formatNumber } from '@/utils/helps'
import myFont from '@/assets/myFont'
import { useSelectedReports } from './useSelectedReports'

export function useGenerateSyneyStoreReportPDF() {
  const doc = new jsPDF({ orientation: 'l' })
  // 设置中文字体
  doc.addFileToVFS('msyh.ttf', myFont)
  doc.addFont('msyh.ttf', 'myFont', 'normal')
  doc.setFont('myFont')

  const { selectedMap, selectedReportsLoading } = useSelectedReports()

  if (!selectedReportsLoading) {
    selectedMap?.forEach((data, No) => {
      const totalPage = Math.ceil((data.items.length + 1) / 25)

      doc.addPage()
      doc.setPage(doc.internal.pages[doc.internal.pages.length - 1] + 1)

      const items = data.items
        .sort((a, b) => a.PartNo?.localeCompare(b.PartNo!) || 0)
        .map((item: ISyneyItem, index: number) => [
          index + 1 + '',
          item.PartNo,
          item.PartName,
          item.Spec,
          item.ParamSpec,
          item.Unit,
          formatNumber(item.TaxUnitPrice!),
          item.Qty + '',
          formatNumber(item.TaxTotalPrice!),
        ])

      autoTable(doc, {
        head: [
          [
            '序号',
            '件号',
            '名称',
            '规格',
            '参数规格',
            '单位',
            '单价',
            '数量',
            '小计',
          ],
        ],
        body: items?.concat([
          [
            '*',
            '合计',
            '',
            '',
            '',
            '',
            '',
            data.items
              .map((d) => d.Qty)
              .reduce((a, b) => (a ?? 0) + (b ?? 0), 0) + '',
            formatNumber(data.totalAmount ?? 0),
          ],
        ]),
        margin: { top: 35 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
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
            '西尼对账单',
            (dataOfPage.cursor?.x ?? 0) + 120,
            (dataOfPage.cursor?.y ?? 0) - 22,
          )

          autoTable(doc, {
            margin: { top: 22 },
            styles: {
              font: 'myFont',
              cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
              halign: 'center',
              valign: 'middle',
            },
            theme: 'plain',
            headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
            head: [['入库单号', '对账日期']],
            body: [[No, format(new Date(data.createdAt), 'yyyy-MM-dd')]],
          })
        },
        didDrawPage: (dataOfPage) => {
          doc.text(
            `第${dataOfPage.pageNumber}页，共${totalPage}页`,
            (dataOfPage.cursor?.x ?? 0) - 150,
            (dataOfPage.cursor?.y ?? 0) + 10,
          )
        },
      })
    })
    doc.deletePage(1)
  }

  function print() {
    doc.output('dataurlnewwindow', {
      filename: `new`,
    })
  }

  return {
    print,
  }
}
