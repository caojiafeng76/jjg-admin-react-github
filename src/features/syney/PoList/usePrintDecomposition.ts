import { useState } from 'react'
import { message } from 'antd'
import jsPDF from 'jspdf'

import myFont2 from '@/assets/myFont2'
import { useSelectedPos } from './useSelectedPos'
import { initializePDF, openPDFInNewWindow } from '@/utils/pdfUtils'
import { ISyneyItem } from '@/services/types'

interface ISyneyPoGroup {
  key: string
  poInfo: {
    SONo: string
    Spec: string
    EndDate: string
    No: string
    SerialNo: string
    Brand: string
    Technique: string
    Remark: string
  }
  items: ISyneyItem[]
}

// 页面配置常量
const CONFIG = {
  ROWS_PER_PAGE: 4,
  ROW_HEIGHT: 40,
  BASE_Y: 60, // 第一行数据的基准Y坐标（对应原代码的 60 + i * 40）
  FRAME_START_Y: 30, // 框架起始Y坐标
}

export function usePrintDecomposition() {
  const { selectedPosList, isLoading } = useSelectedPos()
  const [messageApi, contextHolder] = message.useMessage()
  const [isPrinting, setIsPrinting] = useState(false)

  /**
   * 绘制页面框架（表头、线条、固定文本）
   */
  function drawPageFrame(doc: jsPDF) {
    doc.setFontSize(20)
    doc.text('踏板分解单', 120, 20)

    doc.rect(15, 30, 270, 170) // 画一个方框
    doc.line(15, 40, 285, 40)

    doc.setFontSize(10)

    // 表头文字和竖线
    // 序号
    doc.text('序号', 18, 37)
    doc.line(28, 30, 28, 40)

    // 交货日期
    doc.text('交货日期', 32, 37)
    doc.line(50, 30, 50, 40)

    // 台数
    doc.text('台数', 52, 37)
    doc.line(62, 30, 62, 40)

    // 名称
    doc.text('名称', 64, 37)
    doc.line(74, 30, 74, 40)

    // 规格
    doc.text('规格', 78, 37)
    doc.line(89, 30, 89, 40)

    // 件数
    doc.text('件数', 90, 37)
    doc.line(98, 30, 98, 40)

    // 名称
    doc.text('名称', 100, 37)
    doc.line(110, 30, 110, 40)

    // 规格
    doc.text('规格', 114, 37)
    doc.line(125, 30, 125, 40)

    // 件数
    doc.text('件数', 128, 37)
    doc.line(134, 30, 134, 40)

    // 名称
    doc.text('名称', 138, 37)
    doc.line(146, 30, 146, 40)

    // 规格
    doc.text('规格', 150, 37)
    doc.line(161, 30, 161, 40) // 原代码 146 + 15 = 161

    // 件数
    doc.text('件数', 164, 37)
    doc.line(170, 30, 170, 40) // 原代码 146 + 15 + 9 = 170

    // 名称
    doc.text('名称', 172, 37)
    doc.line(182, 30, 182, 40) // 原代码 170 + 12 = 182

    // 规格
    doc.text('规格', 186, 37)
    doc.line(197, 30, 197, 40) // 原代码 170 + 12 + 15 = 197

    // 件数
    doc.text('件数', 198, 37)
    doc.line(206, 30, 206, 40) // 原代码 170 + 12 + 15 + 9 = 206

    // 类型
    doc.text('类型', 208, 37)
    doc.line(220, 30, 220, 40) // 原代码 206 + 14 = 220

    // 工艺要求
    doc.text('工艺要求', 224, 37)
    doc.line(242, 30, 242, 40) // 原代码 220 + 22 = 242

    // 横 围
    doc.text('横 围', 246, 37)
    doc.line(257, 30, 257, 40) // 原代码 242 + 15 = 257

    // 侧 围
    doc.text('侧 围', 261, 37)
    doc.line(270, 30, 270, 40) // 原代码 256 + 14 = 270

    // 围框垫
    doc.text('围框垫', 273, 37)

    // 绘制 4 行的表格框架
    for (let i = 0; i < CONFIG.ROWS_PER_PAGE; i++) {
      const yBase = CONFIG.BASE_Y + i * CONFIG.ROW_HEIGHT
      const yLine1 = yBase // 60, 100, 140, 180
      const yLine2 = yBase + 10 // 70, 110, 150, 190

      // 横线
      doc.line(28, yLine1, 285, yLine1)
      doc.line(28, yLine2, 285, yLine2)

      // 局部横线
      doc.line(110, yBase - 10, 134, yBase - 10) // 50, 90...
      doc.line(146, yBase - 10, 170, yBase - 10)
      doc.line(182, yBase - 10, 206, yBase - 10)
      doc.line(257, yBase - 10, 270, yBase - 10)

      // 竖线 (从 40+i*40 到 60+i*40) => (yBase-20 到 yBase)
      const vLineStart = yBase - 20
      const vLineEnd = yBase

      const xCoords = [
        50, 62, 74, 89, 98, 110, 125, 134, 146, 161, 170, 182, 197, 206, 220,
        242, 257, 270,
      ]
      xCoords.forEach((x) => doc.line(x, vLineStart, x, vLineEnd))

      // 固定文字
      doc.setFontSize(16)
      doc.text('前', 65, yBase - 13)
      doc.text('板', 65, yBase - 4)

      doc.text('中', 101, yBase - 13)
      doc.text('板', 101, yBase - 4)

      doc.text('后', 137, yBase - 13)
      doc.text('板', 137, yBase - 4)

      doc.setFontSize(12)
      doc.text('加', 174, yBase - 16)
      doc.text('长', 174, yBase - 9)
      doc.text('板', 174, yBase - 2)

      doc.setFontSize(10)
      doc.text('订单号：', 30, yBase + 7)
      doc.text('商标：', 85, yBase + 7)
      doc.text('编号：', 155, yBase + 7)
      doc.text('合同号：', 200, yBase + 7)
      doc.text('备注：', 30, yBase + 17)
    }

    // 整体长竖线
    doc.line(28, 40, 28, 200)

    // 整体长横线 (分隔每一行)
    // 80, 120, 160
    for (let i = 1; i < CONFIG.ROWS_PER_PAGE; i++) {
      const y = 40 + i * CONFIG.ROW_HEIGHT
      doc.line(15, y, 285, y)
    }
  }

  /**
   * 填充页面数据
   */
  function fillPageData(doc: jsPDF, data: ISyneyPoGroup[], pageIndex: number) {
    data.forEach((record, i) => {
      const { poInfo, items } = record
      const { SONo, Spec, EndDate, No, SerialNo, Brand, Technique, Remark } =
        poInfo
      const [xinghao, huanjing, leixing] = (Spec || '').split('-')

      const yBase = CONFIG.BASE_Y + i * CONFIG.ROW_HEIGHT

      doc.setFontSize(20)
      // 全局序号
      doc.text(`${pageIndex * CONFIG.ROWS_PER_PAGE + i + 1}`, 20, yBase + 1)
      doc.text('1', 55, yBase - 9)

      doc.setFontSize(10)
      doc.text(`${EndDate ? EndDate.substring(0, 10) : ''}`, 30, yBase - 9)
      doc.text(`${No || ''}`, 50, yBase + 7)
      doc.text(`${SONo || ''}`, 220, yBase + 7)
      doc.text(`${SerialNo || ''}`, 175, yBase + 7)
      doc.text(`${Brand || ''}`, 105, yBase + 7)

      if (Technique && Technique !== 'null') {
        const [line1, line2, line3] = Technique.split(',')
        doc.text(line1 ? `${line1}` : '', 223, yBase - 16)
        doc.text(line2 ? `${line2}` : '', 223, yBase - 9)
        doc.text(line3 ? `${line3}` : '', 223, yBase - 2)
      }

      doc.text(
        `${xinghao || ''}`,
        (xinghao || '').length === 5 ? 207 : 208,
        yBase - 16,
      )
      doc.text(`${huanjing || ''}`, 209, yBase - 9)
      doc.text(
        `${leixing || ''}`,
        (leixing || '').length === 3 ? 208 : 209,
        yBase - 2,
      )

      doc.text('橡胶', 273, yBase - 9)

      if (Remark && Remark !== 'null') {
        doc.text(`${Remark}`, 50, yBase + 17)
      }

      // 填充明细项
      doc.setFontSize(8)
      items.forEach((item: ISyneyItem) => {
        const { PartNo, ParamSpec, Qty, Remark: ItemRemark } = item
        const specText = ParamSpec ? ParamSpec : ''

        // 前板规格
        if (PartNo?.includes('XN2808EB') || PartNo?.includes('XN3024BR')) {
          doc.setFontSize(8)
          doc.text(specText, 75, yBase - 9)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 92, yBase - 9)
        }

        // 上中板规格
        if (
          PartNo?.includes('XN2808BP') ||
          PartNo?.includes('XN3024BS') ||
          PartNo?.includes('XN2808JY') ||
          PartNo?.includes('XN3024DF')
        ) {
          doc.setFontSize(8)
          doc.text(specText, 111, yBase - 13)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 128, yBase - 13)
        }

        // 下中板规格
        if (
          PartNo?.includes('XN2808BQ') ||
          PartNo?.includes('XN3024BT') ||
          PartNo?.includes('XN2808JZ') ||
          PartNo?.includes('XN3024DG')
        ) {
          doc.setFontSize(8)
          doc.text(specText, 111, yBase - 4)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 128, yBase - 4)
        }

        // 上后板规格
        if (
          (PartNo?.includes('XN2808AF') && ItemRemark?.includes('上头部')) ||
          PartNo?.includes('XN3024BX')
        ) {
          doc.setFontSize(8)
          doc.text(specText, 147, yBase - 13)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 164, yBase - 13)
        }

        // 下后板规格
        if (
          (PartNo?.includes('XN2808AF') && ItemRemark?.includes('下头部')) ||
          PartNo?.includes('XN3024BY')
        ) {
          doc.setFontSize(8)
          doc.text(specText, 147, yBase - 4)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 164, yBase - 4)
        }

        // 上加长板
        if (PartNo?.includes('XN2808AL') && ItemRemark?.includes('上头部')) {
          doc.setFontSize(8)
          doc.text(specText, 183, yBase - 13)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 200, yBase - 13)
        }

        // 下加长板
        if (PartNo?.includes('XN2808AL') && ItemRemark?.includes('下头部')) {
          doc.setFontSize(8)
          doc.text(specText, 183, yBase - 4)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 200, yBase - 4)
        }

        // 横围
        if (PartNo?.includes('XN2808EC') || PartNo?.includes('XN2838CP')) {
          doc.setFontSize(8)
          const specVal = specText.includes('=')
            ? specText.slice(specText.indexOf('=') + 1)
            : specText
          doc.text(`${specVal}*${Qty}`, 244, yBase - 9)
        }

        // 上侧围
        if (
          (PartNo?.includes('XN2808ED') || PartNo?.includes('XN2838CQ')) &&
          ItemRemark?.includes('上头部')
        ) {
          const count = items
            .filter(
              (it: ISyneyItem) =>
                (it.PartNo?.includes('XN2808ED') ||
                  it.PartNo?.includes('XN2838CQ')) &&
                it.Remark?.includes('上头部'),
            )
            .map((it: ISyneyItem) => it.Qty)
            .reduce((a: number, b: number | null) => (a || 0) + (b || 0), 0)

          doc.setFontSize(8)
          const specVal = specText.includes('=')
            ? specText.slice(specText.indexOf('=') + 1)
            : specText
          doc.text(`${specVal}*${count}`, 259, yBase - 13)
        }

        // 下侧围
        if (
          (PartNo?.includes('XN2808ED') || PartNo?.includes('XN2838CQ')) &&
          ItemRemark?.includes('下头部')
        ) {
          const count = items
            .filter(
              (it: ISyneyItem) =>
                (it.PartNo?.includes('XN2808ED') ||
                  it.PartNo?.includes('XN2838CQ')) &&
                it.Remark?.includes('下头部'),
            )
            .map((it: ISyneyItem) => it.Qty)
            .reduce((a: number, b: number | null) => (a || 0) + (b || 0), 0)

          doc.setFontSize(8)
          const specVal = specText.includes('=')
            ? specText.slice(specText.indexOf('=') + 1)
            : specText
          doc.text(`${specVal}*${count}`, 259, yBase - 4)
        }
      })
    })
  }

  async function printDecomposition() {
    if (isLoading) {
      messageApi.warning('数据加载中，请稍后再试')
      return
    }

    if (!selectedPosList || selectedPosList.length === 0) {
      messageApi.warning('没有数据可供打印')
      return
    }

    try {
      setIsPrinting(true)
      // 1. 初始化 PDF
      const doc = initializePDF('l')

      // 2. 注册并设置专用字体 (为了兼容性)
      doc.addFileToVFS('msyh_bold.ttf', myFont2)
      doc.addFont('msyh_bold.ttf', 'SourceHanSansCN-Bold', 'normal')
      doc.setFont('SourceHanSansCN-Bold')

      // 3. 计算分页
      const total = selectedPosList.length
      const totalPages = Math.ceil(total / CONFIG.ROWS_PER_PAGE)

      // 4. 生成每一页
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        if (pageIndex > 0) {
          doc.addPage()
        }

        drawPageFrame(doc)

        const start = pageIndex * CONFIG.ROWS_PER_PAGE
        const end = Math.min(start + CONFIG.ROWS_PER_PAGE, total)
        const pageData = selectedPosList.slice(start, end)

        fillPageData(doc, pageData, pageIndex)

        // 让出控制权，避免阻塞 UI
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      // 5. 输出 PDF
      openPDFInNewWindow(doc)
      messageApi.success('打印完成')
    } catch (error) {
      console.error('打印分解单失败:', error)
      messageApi.error('打印失败，请重试')
    } finally {
      setIsPrinting(false)
    }
  }

  return { printDecomposition, contextHolder, isPrinting }
}
