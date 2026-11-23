import type { SyneySafePartSetting } from '@services/apiSyneySafePartSettings'
import type jsPDF from 'jspdf'
import { App } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'

import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { GOOGLE_FONT_CONFIG, loadGoogleFont } from '@/utils/googleFontLoader'
import {
  getLabelInfoBySettings,
  getLabelInfoFromStoredItem,
} from '@/utils/syneySafePartRules'
import { useTableSelection } from '../useTableSelection'
import { useFetchSelectedPos } from './useFetchSelectedPos'

function loadPDFDependencies() {
  return Promise.all([import('jspdf'), import('@/utils/pdfUtils')])
}

export function usePrint(
  safePartSettings: SyneySafePartSetting[] | undefined,
  isSafePartSettingsLoading: boolean,
) {
  const { tableSelectedKeys } = useTableSelection()
  const { fetchSelectedPos } = useFetchSelectedPos()
  const { message: api } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  function preloadPDF() {
    void loadPDFDependencies()
  }

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

  async function generateLabel(): Promise<boolean> {
    if (isPrinting) {
      return false
    }

    if (tableSelectedKeys.length === 0) {
      api.warning(feedbackText.selectRequired('打印'))
      return false
    }

    if (isSafePartSettingsLoading || !safePartSettings) {
      api.warning('件号配置加载中，请稍后再试')
      return false
    }

    try {
      setIsPrinting(true)
      const selectedPosList = await fetchSelectedPos()

      if (selectedPosList.length === 0) {
        api.warning('没有数据可供打印')
        return false
      }

      const [jsPDFModule, { openPDFInNewWindow }] = await loadPDFDependencies()
      const jsPDF = jsPDFModule.default
      // 创建 PDF 文档
      const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: [90, 30] })

      // 动态加载 Google Font
      const fontData = await loadGoogleFont()
      doc.addFileToVFS(GOOGLE_FONT_CONFIG.FONT_NAME, fontData)
      doc.addFont(
        GOOGLE_FONT_CONFIG.FONT_NAME,
        GOOGLE_FONT_CONFIG.FONT_FAMILY,
        GOOGLE_FONT_CONFIG.FONT_STYLE,
      )
      doc.setFont(GOOGLE_FONT_CONFIG.FONT_FAMILY)

      // 设置字体大小
      doc.setFontSize(8)

      let isFirstPage = true
      let pageCount = 0

      for (const { po, items } of selectedPosList) {
        const soNo = po.SONo ?? ''
        const spec = po.Spec ?? ''
        const endDate = po.EndDate ? dayjs(po.EndDate).format('YYYY-MM-DD') : ''
        const serialNo = po.SerialNo ?? ''

        // 1. 打印 Item 标签
        for (const item of items) {
          const labelInfo
            = getLabelInfoBySettings(item.PartNo, serialNo, safePartSettings)
              ?? getLabelInfoFromStoredItem(item, safePartSettings)

          if (labelInfo) {
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
              const partNameX = labelInfo.partName2.length === 5 ? 21 : 23
              drawBoldText(doc, labelInfo.partName2, partNameX, 6)
              drawBoldText(doc, `${item.ParamSpec ?? ''}`, 21, 11)
              drawBoldText(doc, labelInfo.partCode, 21, 16)
              drawBoldText(doc, '1', 27, 21)

              const partNo = item.PartNo ?? ''
              let PartNoX = 53
              switch (partNo.length) {
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
              drawBoldText(doc, partNo, PartNoX, 6)

              drawBoldText(doc, `${item.SONo ?? ''}`, 53, 11)
              drawBoldText(doc, labelInfo.partModel, 58, 16)
              drawBoldText(doc, endDate, 58, 21)

              pageCount++
              if (pageCount % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0))
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
        drawBoldText(doc, `${spec.split('-').at(0) ?? ''}`, 23, 11)
        drawBoldText(doc, '1', 27, 21)
        // 件号为空，不填
        drawBoldText(doc, soNo, 53, 11)
        drawBoldText(doc, endDate, 58, 21)

        pageCount++
        if (pageCount % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }

      // 输出 PDF
      openPDFInNewWindow(doc)
      return true
    }
    catch (error) {
      console.error('打印标签失败:', error)
      api.error(getUserErrorMessage(error, feedbackText.failed('打印', '中文标签')))
      return false
    }
    finally {
      setIsPrinting(false)
    }
  }

  return {
    generateLabel,
    preloadPDF,
    isPrinting,
  }
}
