import type jsPDF from 'jspdf'
import { useState } from 'react'

import { loadGoogleFont, GOOGLE_FONT_CONFIG } from '@/utils/googleFontLoader'
import type { YoumaiFinishedGoodsStockOut } from '@/services/apiYoumaiFinishedGoodsStockOut'

const loadYoumaiLabelPdfRuntime = () =>
  Promise.all([import('jspdf'), import('@/utils/pdfUtils')] as const)

function preloadPrint() {
  void loadYoumaiLabelPdfRuntime()
}

export function usePrintYoumaiLabel() {
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
   * 绘制标签框架（线条和固定标题）
   * 严格按照图片样式：90x30mm 横向标签
   */
  function drawLabelFrame(doc: jsPDF) {
    // 外框：90x30mm 标签，边距 3mm
    doc.rect(3, 2, 84, 26)

    // 横线（分隔行）
    doc.line(3, 10, 87, 10) // ISO 行底部（公司名与 ISO 之间无横线）
    doc.line(3, 15, 87, 15) // 物料编码行底部
    doc.line(3, 20, 87, 20) // 产品名称行底部

    // 竖线（分隔列，只在明细区域 10~20）
    doc.line(15, 10, 15, 20) // 物料编码/产品名称 标题列右边
    doc.line(50, 10, 50, 20) // 值与规格/数量 标题列左边
    doc.line(60, 10, 60, 20) // 规格/数量 标题与值列左边

    // 固定标题
    doc.setFontSize(7)
    drawBoldText(doc, '物料编码', 4, 14)
    drawBoldText(doc, '规格', 52, 14)
    drawBoldText(doc, '产品名称', 4, 19)
    drawBoldText(doc, '数量', 52, 19)
  }

  async function printLabels(items: YoumaiFinishedGoodsStockOut[]) {
    if (!items || items.length === 0) {
      throw new Error('没有数据可供打印')
    }

    try {
      setIsPrinting(true)

      const [[{ default: JsPDF }, { openPDFInNewWindow }], fontData] =
        await Promise.all([loadYoumaiLabelPdfRuntime(), loadGoogleFont()])
      const doc = new JsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [90, 30],
      })

      // 动态加载 Google Font
      doc.addFileToVFS(GOOGLE_FONT_CONFIG.FONT_NAME, fontData)
      doc.addFont(
        GOOGLE_FONT_CONFIG.FONT_NAME,
        GOOGLE_FONT_CONFIG.FONT_FAMILY,
        GOOGLE_FONT_CONFIG.FONT_STYLE,
      )
      doc.setFont(GOOGLE_FONT_CONFIG.FONT_FAMILY, GOOGLE_FONT_CONFIG.FONT_STYLE)

      // 设置字体大小
      doc.setFontSize(7)

      let isFirstPage = true
      let pageCount = 0

      for (const item of items) {
        const quantity = item.stock_out_quantity ?? 1

        for (let i = 0; i < quantity; i++) {
          pageCount++

          if (!isFirstPage) {
            doc.addPage()
          }
          isFirstPage = false

          drawLabelFrame(doc)

          // 第一行：公司名称（字号加大）
          doc.setFontSize(9)
          drawBoldText(doc, '湖州银都铝业科技有限公司', 4, 6)

          // 第二行：ISO认证
          doc.setFontSize(7)
          drawBoldText(doc, 'ISO9001:2015认证', 4, 9)

          // 第三行：物料编码、规格
          drawBoldText(doc, item.material_code || '', 16, 14)
          drawBoldText(doc, item.specification || '', 62, 14)

          // 第四行：产品名称、数量（固定为1）
          drawBoldText(doc, item.material_name || '', 16, 19)
          drawBoldText(doc, '1', 62, 19)

          // 底部：地址、电话、传真
          doc.setFontSize(6)
          drawBoldText(
            doc,
            '公司地址:湖州市南浔区南浔镇杨华村工业园区18号',
            4,
            24,
          )
          drawBoldText(doc, '销售电话:0572-3058982', 4, 27)
          drawBoldText(doc, '传真:0572-3058106', 48, 27)

          // 每10页让出控制权，避免阻塞UI
          if (pageCount % 10 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0))
          }
        }
      }

      // 输出 PDF
      openPDFInNewWindow(doc)
    } finally {
      setIsPrinting(false)
    }
  }

  return { printLabels, isPrinting, preloadPrint }
}
