import jsPDF from 'jspdf'
import { format } from 'date-fns'

import myFont2 from '@/assets/myFont2'
import { useSelectedPos } from './useSelectedPos'

export function usePrint() {
  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: [90, 30] })

  // 设置中文字体
  doc.addFileToVFS('msyh.ttf', myFont2)
  doc.addFont('msyh.ttf', 'myFont', 'normal')
  doc.setFont('myFont')

  // 设置字体大小
  doc.setFontSize(8)

  const { selectedMap, isLoading } = useSelectedPos()

  if (!isLoading) {
    selectedMap?.forEach((data, key) => {
      const [SONo, Spec, EndDate] = key.split('~')
      data.forEach((item) => {
        if (item.PartCode?.length) {
          for (let i = 0; i < (item.Qty || 1); i++) {
            doc.addPage()
            doc.setPage(doc.internal.pages[doc.internal.pages.length - 1] + 1)

            doc.rect(5, 2, 80, 25) // 画一个方框

            doc.line(5, 7, 85, 7) // 第一条横线
            doc.line(5, 12, 85, 12) // 第二条横线
            doc.line(5, 17, 85, 17) // 第三条横线
            doc.line(5, 22, 85, 22) // 第四条横线

            doc.line(20, 2, 20, 22) // 第一条竖线
            doc.line(36, 2, 36, 22) // 第二条竖线
            doc.line(51, 2, 51, 22) // 第三条竖线
            doc.line(36, 22, 36, 27) // 下面竖线

            doc.text('产品名称', 6, 6)
            const PartName2X = item.PartName2?.length === 5 ? 21 : 23
            doc.text(`${item.PartName2}`, PartName2X, 6)

            doc.text('规格', 8, 11)
            doc.text(`${item.ParamSpec}`, 21, 11)

            doc.text('编号', 8, 16)
            doc.text(`${item.PartCode}`, 21, 16)

            doc.text('数量', 8, 21)
            doc.text('1', 27, 21)

            doc.text('件号', 40, 6)
            let PartNoX = 0
            switch (item.PartNo?.length) {
              case 9:
                PartNoX = 58
                break
              case 10:
                PartNoX = 56
                break
              default:
                PartNoX = 53
                break
            }
            doc.text(`${item.PartNo}`, PartNoX, 6)

            doc.text('合同号', 39, 11)
            doc.text(`${item.SONo}`, 53, 11)

            doc.text('产品型号', 38, 16)
            doc.text(`${item.PartModel}`, 58, 16)

            doc.text('制造日期', 38, 21)
            doc.text(`${format(EndDate, 'yyyy-MM-dd')}`, 58, 21)

            doc.text('制造单位名称', 10, 26)
            doc.text('湖州银都铝业科技有限公司', 45, 26)
          }
        }
      })
      doc.addPage()
      doc.setPage(doc.internal.pages[doc.internal.pages.length - 1] + 1)

      doc.rect(5, 2, 80, 25) // 画一个方框

      doc.line(5, 7, 85, 7) // 第一条横线
      doc.line(5, 12, 85, 12) // 第二条横线
      doc.line(5, 17, 85, 17) // 第三条横线
      doc.line(5, 22, 85, 22) // 第四条横线

      doc.line(20, 2, 20, 22) // 第一条竖线
      doc.line(36, 2, 36, 22) // 第二条竖线
      doc.line(51, 2, 51, 22) // 第三条竖线
      doc.line(36, 22, 36, 27) // 下面竖线

      doc.text('产品名称', 6, 6)
      doc.text(`围框`, 24, 6)

      doc.text('规格', 8, 11)
      doc.text(`${Spec.split('-').at(0)}`, 23, 11)

      doc.text('数量', 8, 21)
      doc.text('1', 27, 21)

      doc.text('件号', 40, 6)

      doc.text('合同号', 39, 11)
      doc.text(`${SONo}`, 53, 11)

      doc.text('制造日期', 38, 21)
      doc.text(`${format(EndDate, 'yyyy-MM-dd')}`, 58, 21)

      doc.text('制造单位名称', 10, 26)
      doc.text('湖州银都铝业科技有限公司', 45, 26)
    })
    doc.deletePage(1)
  }
  function generateLabel() {
    doc.output('dataurlnewwindow', {
      filename: '标签',
    })
  }
  return { generateLabel }
}
