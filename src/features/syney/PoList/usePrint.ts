import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { message } from 'antd'
import { useState } from 'react'

import { loadGoogleFont, GOOGLE_FONT_CONFIG } from '@/utils/googleFontLoader'
import { useSelectedPos } from './useSelectedPos'
import { openPDFInNewWindow } from '@/utils/pdfUtils'

// Type for the Ant Design message API instance returned by message.useMessage()
type MessageApi = ReturnType<typeof message.useMessage>[0]

export function usePrint(messageApi?: MessageApi) {
  const { selectedPosList, isLoading } = useSelectedPos()
  const [internalMessageApi, contextHolder] = message.useMessage()
  const api = messageApi || internalMessageApi
  const [isPrinting, setIsPrinting] = useState(false)

  function drawBoldText(
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    options?: Record<string, unknown>,
  ) {
    doc.text(text, x, y, options)
    doc.text(text, x + 0.12, y, options)
  }

  /**
   * 绘制标签框架（线条和通用标题）
   */
  function drawLabelFrame(doc: jsPDF) {
    doc.rect(5, 2, 80, 25) // 画一个方框

    doc.line(5, 7, 85, 7) // 第一条横线
    doc.line(5, 12, 85, 12) // 第二条横线
    doc.line(5, 17, 85, 17) // 第三条横线
    doc.line(5, 22, 85, 22) // 第四条横线

    doc.line(20, 2, 20, 22) // 第一条竖线
    doc.line(36, 2, 36, 22) // 第二条竖线
    doc.line(51, 2, 51, 22) // 第三条竖线
    doc.line(36, 22, 36, 27) // 下面竖线

    // 通用标题
    drawBoldText(doc, '产品名称', 6, 6)
    drawBoldText(doc, '规格', 8, 11)
    drawBoldText(doc, '数量', 8, 21)
    drawBoldText(doc, '件号', 40, 6)
    drawBoldText(doc, '合同号', 39, 11)
    drawBoldText(doc, '制造日期', 38, 21)
    drawBoldText(doc, '制造单位名称', 10, 26)
    drawBoldText(doc, '湖州银都铝业科技有限公司', 45, 26)
  }

  async function generateLabel() {
    // 数据验证
    if (isLoading) {
      api.warning('数据加载中，请稍后再试')
      return
    }

    if (!selectedPosList || selectedPosList.length === 0) {
      api.warning('没有数据可供打印')
      return
    }

    try {
      setIsPrinting(true)
      // 创建 PDF 文档
      const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: [90, 30] })

      // 动态加载 Google Font
      const fontData = await loadGoogleFont()
      doc.addFileToVFS(GOOGLE_FONT_CONFIG.FONT_NAME, fontData)
      doc.addFont(GOOGLE_FONT_CONFIG.FONT_NAME, GOOGLE_FONT_CONFIG.FONT_FAMILY, GOOGLE_FONT_CONFIG.FONT_STYLE)
      doc.setFont(GOOGLE_FONT_CONFIG.FONT_FAMILY)

      // 设置字体大小
      doc.setFontSize(8)

      let isFirstPage = true
      let pageCount = 0

      for (const { poInfo, items } of selectedPosList) {
        const { SONo, Spec, EndDate } = poInfo

        // 1. 打印 Item 标签
        for (const item of items) {
          if (item.PartCode?.length) {
            for (let i = 0; i < (item.Qty || 1); i++) {
              if (!isFirstPage) {
                doc.addPage()
              }
              isFirstPage = false

              drawLabelFrame(doc)

              // 补充 Item 特有的标题
              drawBoldText(doc, '编号', 8, 16)
              drawBoldText(doc, '产品型号', 38, 16)

              // 填充数据
              const PartName2X = item.PartName2?.length === 5 ? 21 : 23
              drawBoldText(doc, `${item.PartName2}`, PartName2X, 6)
              drawBoldText(doc, `${item.ParamSpec}`, 21, 11)
              drawBoldText(doc, `${item.PartCode}`, 21, 16)
              drawBoldText(doc, '1', 27, 21)

              let PartNoX = 53
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
              drawBoldText(doc, `${item.PartNo}`, PartNoX, 6)

              drawBoldText(doc, `${item.SONo}`, 53, 11)
              drawBoldText(doc, `${item.PartModel}`, 58, 16)
              drawBoldText(doc, `${format(EndDate, 'yyyy-MM-dd')}`, 58, 21)

              pageCount++
              if (pageCount % 10 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 0))
              }
            }
          }
        }

        // 2. 打印围框标签
        if (!isFirstPage) {
          doc.addPage()
        }
        isFirstPage = false

        drawLabelFrame(doc)

        // 填充围框数据
        drawBoldText(doc, '围框', 24, 6)
        drawBoldText(doc, `${Spec.split('-').at(0)}`, 23, 11)
        drawBoldText(doc, '1', 27, 21)
        // 件号为空，不填
        drawBoldText(doc, `${SONo}`, 53, 11)
        drawBoldText(doc, `${format(EndDate, 'yyyy-MM-dd')}`, 58, 21)

        pageCount++
        if (pageCount % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      // 输出 PDF
      openPDFInNewWindow(doc)
    } catch (error) {
      console.error('打印标签失败:', error)
      api.error('打印标签失败')
    } finally {
      setIsPrinting(false)
    }
  }

  return { generateLabel, contextHolder: messageApi ? null : contextHolder, isPrinting }
}
