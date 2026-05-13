import jsPDF from 'jspdf'
import dayjs from 'dayjs'
import { message } from 'antd'
import { useState } from 'react'

import { loadGoogleFont, GOOGLE_FONT_CONFIG } from '@/utils/googleFontLoader'
import { useSelectedPos } from './useSelectedPos'
import { openPDFInNewWindow } from '@/utils/pdfUtils'
import { SyneySafePartSetting } from '@services/apiSyneySafePartSettings'
import {
  getLabelInfoBySettings,
  getLabelInfoFromStoredItem,
} from '@/utils/syneySafePartRules'

// Type for the Ant Design message API instance returned by message.useMessage()
type MessageApi = ReturnType<typeof message.useMessage>[0]

export function usePrintEnglish(
  safePartSettings: SyneySafePartSetting[] | undefined,
  isSafePartSettingsLoading: boolean,
  messageApi?: MessageApi,
) {
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
   * 绘制英文标签框架（线条和通用标题）
   */
  function drawEnglishLabelFrame(doc: jsPDF) {
    doc.rect(5, 2, 80, 25) // 画一个方框

    doc.line(5, 7, 85, 7) // 第一条横线
    doc.line(5, 12, 85, 12) // 第二条横线
    doc.line(5, 17, 85, 17) // 第三条横线
    doc.line(5, 22, 85, 22) // 第四条横线

    doc.line(20, 2, 20, 22) // 第一条竖线
    doc.line(36, 2, 36, 22) // 第二条竖线
    doc.line(51, 2, 51, 22) // 第三条竖线
    doc.line(36, 22, 36, 27) // 下面竖线

    doc.setFontSize(7)
    // 通用标题
    drawBoldText(doc, 'PartName', 6, 6)
    drawBoldText(doc, 'ParamSpec', 6, 11)
    drawBoldText(doc, 'Qty', 8, 21)
    drawBoldText(doc, 'PartNo', 40, 6)
    drawBoldText(doc, 'SONo', 39, 11)
    drawBoldText(doc, 'EndDate', 38, 21)
    drawBoldText(doc, 'SupplierName', 10, 26)

    doc.setFontSize(5)
    drawBoldText(doc, 'Huzhou Yindu Aluminum Technology Co., Ltd.', 40, 26)
    doc.setFontSize(7)
  }

  async function generateEnglishLabel() {
    // 数据验证
    if (isLoading) {
      api.warning('数据加载中，请稍后再试')
      return
    }

    if (isSafePartSettingsLoading || !safePartSettings) {
      api.warning('安全部件设置加载中，请稍后再试')
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
      doc.setFontSize(7)

      let isFirstPage = true
      let pageCount = 0

      for (const { poInfo, items } of selectedPosList) {
        const { SONo, Spec, EndDate, SerialNo } = poInfo

        // 1. 打印 Item 标签
        for (const item of items) {
          const labelInfo = getLabelInfoBySettings(
            item.PartNo,
            SerialNo,
            safePartSettings,
          ) ?? getLabelInfoFromStoredItem(item, safePartSettings)

          if (labelInfo) {
            for (let i = 0; i < (item.Qty || 1); i++) {
              if (!isFirstPage) {
                doc.addPage()
              }
              isFirstPage = false

              drawEnglishLabelFrame(doc)

              // Item 特有的标题
              drawBoldText(doc, 'PartCode', 6, 16)
              drawBoldText(doc, 'PartModel', 38, 16)

              // 填充数据
              doc.setFontSize(6)
              drawBoldText(doc, labelInfo.englishPartName, 21, 6)
              doc.setFontSize(7)

              drawBoldText(doc, `${item.ParamSpec}`, 21, 11)
              drawBoldText(doc, labelInfo.partCode, 21, 16)
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
              drawBoldText(doc, labelInfo.partModel, 58, 16)
              drawBoldText(doc, `${dayjs(EndDate).format('YYYY-MM-DD')}`, 58, 21)

              pageCount++
              if (pageCount % 10 === 0) {
                await new Promise((resolve) => setTimeout(resolve, 0))
              }
            }
          }
        }

        // 2. 打印 Frame 标签
        if (!isFirstPage) {
          doc.addPage()
        }
        isFirstPage = false

        drawEnglishLabelFrame(doc)

        // 填充 Frame 数据
        drawBoldText(doc, 'Frame', 24, 6)
        drawBoldText(
          doc,
          `${/\d+/g.exec(Spec.split('-').at(0) || '')?.at(0)}#`,
          24,
          11,
        )
        drawBoldText(doc, '1', 27, 21)
        drawBoldText(doc, `${SONo}`, 53, 11)
        drawBoldText(doc, `${dayjs(EndDate).format('YYYY-MM-DD')}`, 58, 21)

        pageCount++
        if (pageCount % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      // 输出 PDF
      openPDFInNewWindow(doc)
    } catch (error) {
      console.error('打印英文标签失败:', error)
      api.error('打印英文标签失败')
    } finally {
      setIsPrinting(false)
    }
  }

  return { generateEnglishLabel, contextHolder: messageApi ? null : contextHolder, isPrinting }
}
