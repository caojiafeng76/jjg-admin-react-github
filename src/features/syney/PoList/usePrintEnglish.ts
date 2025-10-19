import jsPDF from 'jspdf'
import { format } from 'date-fns'

import myFont2 from '@/assets/myFont2'
import { useSelectedPos } from './useSelectedPos'

export function usePrintEnglish() {
  const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: [90, 30] })

  // 设置中文字体
  doc.addFileToVFS('msyh.ttf', myFont2)
  doc.addFont('msyh.ttf', 'myFont', 'normal')
  doc.setFont('myFont')

  // 设置字体大小
  doc.setFontSize(7)

  const { selectedMap, isLoading } = useSelectedPos()

  if (!isLoading) {
    selectedMap?.forEach((data, key) => {
      const [SONo, Spec, EndDate] = key.split('~')
      data.forEach((item) => {
        // 设置字体大小
        doc.setFontSize(7)
        if (item.PartCode?.length) {
          for (let i = 0; i < (item.Qty || 1); i++) {
            // 设置字体大小
            doc.setFontSize(7)

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

            doc.text('PartName', 6, 6)

            // 设置字体大小
            doc.setFontSize(6)

            const PartName2 =
              item.PartName2?.length === 5 ? 'COMB PLATE' : 'COVER PLATE'
            doc.text(`${PartName2}`, 21, 6)

            // 设置字体大小
            doc.setFontSize(7)

            doc.text('ParamSpec', 6, 11)
            doc.text(`${item.ParamSpec}`, 21, 11)

            doc.text('PartCode', 6, 16)
            doc.text(`${item.PartCode}`, 21, 16)

            doc.text('Qty', 8, 21)
            doc.text('1', 27, 21)

            doc.text('PartNo', 40, 6)
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

            doc.text('SONo', 39, 11)
            doc.text(`${item.SONo}`, 53, 11)

            doc.text('PartModel', 38, 16)
            doc.text(`${item.PartModel}`, 58, 16)

            doc.text('EndDate', 38, 21)
            doc.text(`${format(EndDate, 'yyyy-MM-dd')}`, 58, 21)

            doc.text('SupplierName', 10, 26)
            doc.setFontSize(5)
            doc.text('Huzhou Yindu Aluminum Technology Co. , Ltd.', 40, 26)
          }
        }
      })

      doc.setFontSize(7)

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

      doc.text('PartName', 6, 6)
      doc.text(`Frame`, 24, 6)

      doc.text('ParamSpec', 6, 11)
      doc.text(`${/\d+/g.exec(Spec.split('-').at(0) || '')?.at(0)}#`, 24, 11)

      doc.text('Qty', 8, 21)
      doc.text('1', 27, 21)

      doc.text('PartNo', 40, 6)

      doc.text('SONo', 39, 11)
      doc.text(`${SONo}`, 53, 11)

      doc.text('EndDate', 38, 21)
      doc.text(`${format(EndDate, 'yyyy-MM-dd')}`, 58, 21)

      doc.text('SupplierName', 10, 26)
      doc.setFontSize(5)
      doc.text('Huzhou Yindu Aluminum Technology Co., Ltd.', 40, 26)
    })
    doc.deletePage(1)
  }
  function generateEnglishLabel() {
    doc.output('dataurlnewwindow', {
      filename: 'Label',
    })
  }
  return { generateEnglishLabel }
}
