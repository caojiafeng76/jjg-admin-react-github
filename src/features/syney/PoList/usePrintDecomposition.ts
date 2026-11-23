import type jsPDF from 'jspdf'
import type { SelectedSyneyPoWithItems } from '@/services/apiSyneyPos'
import type { SyneySafePartSetting } from '@/services/apiSyneySafePartSettings'
import type { DecompositionCell } from '@/utils/syneyDecomposition'
import { App } from 'antd'
import { useState } from 'react'

import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { buildDecompositionCells } from '@/utils/syneyDecomposition'
import { useTableSelection } from '../useTableSelection'
import { useFetchSelectedPos } from './useFetchSelectedPos'

const loadPDFUtils = () => import('@/utils/pdfUtils')

// 页面配置常量
const CONFIG = {
  ROWS_PER_PAGE: 4,
  ROW_HEIGHT: 40,
  BASE_Y: 60, // 第一行数据的基准Y坐标（对应原代码的 60 + i * 40）
  FRAME_START_Y: 30, // 框架起始Y坐标
  MAX_TECHNIQUE_LINES: 3, // 工艺要求最多显示行数（受PDF格子高度限制）
}

function stripSpecPrefix(spec: string) {
  return spec.includes('=') ? spec.slice(spec.indexOf('=') + 1) : spec
}

export function usePrintDecomposition(
  safePartSettings?: SyneySafePartSetting[],
  isSafePartSettingsLoading = false,
) {
  const { tableSelectedKeys } = useTableSelection()
  const { fetchSelectedPos } = useFetchSelectedPos()
  const { message: messageApi } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  function preloadPDF() {
    void loadPDFUtils()
  }

  /**
   * 绘制页面框架（表头、线条、固定文本）
   */
  function drawPageFrame(doc: jsPDF) {
    doc.setFontSize(20)
    // 居中标题：15 + 270/2 = 150
    doc.text('踏板分解单', 150, 20, { align: 'center' })

    doc.rect(15, 30, 270, 170) // 画一个方框
    doc.line(15, 40, 285, 40)

    doc.setFontSize(10)

    // 表头文字和竖线
    // 序号 (15-28, center 21.5)
    doc.text('序号', 21.5, 37, { align: 'center' })
    doc.line(28, 30, 28, 40)

    // 交货日期 (28-50, center 39)
    doc.text('交货日期', 39, 37, { align: 'center' })
    doc.line(50, 30, 50, 40)

    // 台数 (50-62, center 56)
    doc.text('台数', 56, 37, { align: 'center' })
    doc.line(62, 30, 62, 40)

    // 名称 (62-74, center 68)
    doc.text('名称', 68, 37, { align: 'center' })
    doc.line(74, 30, 74, 40)

    // 规格 (74-89, center 81.5)
    doc.text('规格', 81.5, 37, { align: 'center' })
    doc.line(89, 30, 89, 40)

    // 件数 (89-98, center 93.5)
    doc.text('件数', 93.5, 37, { align: 'center' })
    doc.line(98, 30, 98, 40)

    // 名称 (98-110, center 104)
    doc.text('名称', 104, 37, { align: 'center' })
    doc.line(110, 30, 110, 40)

    // 规格 (110-125, center 117.5)
    doc.text('规格', 117.5, 37, { align: 'center' })
    doc.line(125, 30, 125, 40)

    // 件数 (125-134, center 129.5)
    doc.text('件数', 129.5, 37, { align: 'center' })
    doc.line(134, 30, 134, 40)

    // 名称 (134-146, center 140)
    doc.text('名称', 140, 37, { align: 'center' })
    doc.line(146, 30, 146, 40)

    // 规格 (146-161, center 153.5)
    doc.text('规格', 153.5, 37, { align: 'center' })
    doc.line(161, 30, 161, 40)

    // 件数 (161-170, center 165.5)
    doc.text('件数', 165.5, 37, { align: 'center' })
    doc.line(170, 30, 170, 40)

    // 名称 (170-182, center 176)
    doc.text('名称', 176, 37, { align: 'center' })
    doc.line(182, 30, 182, 40)

    // 规格 (182-197, center 189.5)
    doc.text('规格', 189.5, 37, { align: 'center' })
    doc.line(197, 30, 197, 40)

    // 件数 (197-206, center 201.5)
    doc.text('件数', 201.5, 37, { align: 'center' })
    doc.line(206, 30, 206, 40)

    // 类型 (206-220, center 213)
    doc.text('类型', 213, 37, { align: 'center' })
    doc.line(220, 30, 220, 40)

    // 工艺要求 (220-242, center 231)
    doc.text('工艺要求', 231, 37, { align: 'center' })
    doc.line(242, 30, 242, 40)

    // 横 围 (242-257, center 249.5)
    doc.text('横 围', 249.5, 37, { align: 'center' })
    doc.line(257, 30, 257, 40)

    // 侧 围 (257-270, center 263.5)
    doc.text('侧 围', 263.5, 37, { align: 'center' })
    doc.line(270, 30, 270, 40)

    // 围框垫 (270-285, center 277.5)
    doc.text('围框垫', 277.5, 37, { align: 'center' })

    // 绘制 4 行的表格框架
    const xCoords = [
      50,
      62,
      74,
      89,
      98,
      110,
      125,
      134,
      146,
      161,
      170,
      182,
      197,
      206,
      220,
      242,
      257,
      270,
    ]

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

      xCoords.forEach(x => doc.line(x, vLineStart, x, vLineEnd))
    }

    // 批量绘制文字以减少 setFontSize 调用次数
    // Font Size 16
    doc.setFontSize(16)
    for (let i = 0; i < CONFIG.ROWS_PER_PAGE; i++) {
      const yBase = CONFIG.BASE_Y + i * CONFIG.ROW_HEIGHT
      doc.text('前', 67, yBase - 13, { align: 'center' })
      doc.text('板', 67, yBase - 4, { align: 'center' })

      doc.text('中', 104, yBase - 13, { align: 'center' })
      doc.text('板', 104, yBase - 4, { align: 'center' })

      doc.text('后', 140, yBase - 13, { align: 'center' })
      doc.text('板', 140, yBase - 4, { align: 'center' })
    }

    // Font Size 12
    doc.setFontSize(12)
    for (let i = 0; i < CONFIG.ROWS_PER_PAGE; i++) {
      const yBase = CONFIG.BASE_Y + i * CONFIG.ROW_HEIGHT
      doc.text('加', 176, yBase - 16, { align: 'center' })
      doc.text('长', 176, yBase - 9, { align: 'center' })
      doc.text('板', 176, yBase - 2, { align: 'center' })
    }

    // Font Size 10
    doc.setFontSize(10)
    for (let i = 0; i < CONFIG.ROWS_PER_PAGE; i++) {
      const yBase = CONFIG.BASE_Y + i * CONFIG.ROW_HEIGHT
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
  function fillPageData(
    doc: jsPDF,
    data: SelectedSyneyPoWithItems[],
    pageIndex: number,
  ) {
    data.forEach(({ po, items }, i) => {
      const {
        SONo,
        Spec,
        EndDate,
        No,
        SerialNo,
        Brand,
        Technique,
        Remark,
        BorderMaterial,
      } = po
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
      doc.text(`${SerialNo ?? ''}`, 175, yBase + 7)
      doc.text(`${Brand || ''}`, 105, yBase + 7)

      if (Technique && Technique !== 'null') {
        // 将工艺要求按逗号分割，每个条件另起一行
        const techniqueLines = Technique.split(',').filter(line =>
          line.trim(),
        )
        // 显示所有条件，每个条件另起一行（最多3个，因为只有3个位置）
        techniqueLines.forEach((line, index) => {
          if (index < CONFIG.MAX_TECHNIQUE_LINES) {
            // yBase - 16, yBase - 9, yBase - 2
            const yOffset = index === 0 ? -16 : index === 1 ? -9 : -2
            doc.text(line.trim(), 223, yBase + yOffset)
          }
        })
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

      doc.text(BorderMaterial || '橡胶', 273, yBase - 9)

      // 显示备注，确保"贴牌梯,注意不要出现西尼字样"等备注内容正确显示
      if (Remark && Remark !== 'null' && Remark.trim() !== '') {
        doc.text(`${Remark}`, 50, yBase + 17)
      }

      const drawDecompositionCell = (
        cell: DecompositionCell | undefined,
        specX: number,
        qtyX: number,
        y: number,
      ) => {
        if (!cell)
          return

        doc.setFontSize(8)
        doc.text(cell.spec, specX, y)
        doc.setFontSize(12)
        doc.text(`${cell.qty}`, qtyX, y)
      }

      const decompositionCells = buildDecompositionCells(
        items,
        safePartSettings,
      )

      const { sideFrameUpper, sideFrameLower, crossFrame } = decompositionCells
      if (sideFrameUpper) {
        const upperSpecVal = stripSpecPrefix(sideFrameUpper.spec)
        if (upperSpecVal) {
          doc.setFontSize(8)
          doc.text(`${upperSpecVal}*${sideFrameUpper.qty}`, 259, yBase - 13)
        }
      }

      if (sideFrameLower) {
        const lowerSpecVal = stripSpecPrefix(sideFrameLower.spec)
        if (lowerSpecVal) {
          doc.setFontSize(8)
          doc.text(`${lowerSpecVal}*${sideFrameLower.qty}`, 259, yBase - 4)
        }
      }

      drawDecompositionCell(decompositionCells.frontPlate, 75, 92, yBase - 9)
      drawDecompositionCell(
        decompositionCells.upperMiddle,
        111,
        128,
        yBase - 13,
      )
      drawDecompositionCell(decompositionCells.lowerMiddle, 111, 128, yBase - 4)
      drawDecompositionCell(decompositionCells.rearUpper, 147, 164, yBase - 13)
      drawDecompositionCell(decompositionCells.rearLower, 147, 164, yBase - 4)
      drawDecompositionCell(
        decompositionCells.extensionUpper,
        183,
        200,
        yBase - 13,
      )
      drawDecompositionCell(
        decompositionCells.extensionLower,
        183,
        200,
        yBase - 4,
      )

      if (crossFrame) {
        const crossFrameSpec = stripSpecPrefix(crossFrame.spec)
        if (crossFrameSpec) {
          doc.setFontSize(8)
          doc.text(`${crossFrameSpec}*${crossFrame.qty}`, 244, yBase - 9)
        }
      }
    })
  }

  async function printDecomposition(): Promise<boolean> {
    if (isPrinting) {
      return false
    }

    if (tableSelectedKeys.length === 0) {
      messageApi.warning(feedbackText.selectRequired('打印'))
      return false
    }

    if (tableSelectedKeys.length > 4) {
      messageApi.warning('分解单一次最多打印 4 条订单')
      return false
    }

    if (isSafePartSettingsLoading || !safePartSettings) {
      messageApi.warning('件号配置加载中，请稍后再试')
      return false
    }

    try {
      setIsPrinting(true)
      const selectedPosList = await fetchSelectedPos()

      if (selectedPosList.length === 0) {
        messageApi.warning('没有数据可供打印')
        return false
      }

      const { initializePDF, openPDFInNewWindow } = await loadPDFUtils()
      const doc = await initializePDF('l')

      // 按合同号升序排序
      const sortedPosList = [...selectedPosList].sort((a, b) => {
        const sonoA = a.po.SONo || ''
        const sonoB = b.po.SONo || ''
        return sonoA.localeCompare(sonoB, 'zh-CN', { numeric: true })
      })

      const total = sortedPosList.length
      const totalPages = Math.ceil(total / CONFIG.ROWS_PER_PAGE)

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        if (pageIndex > 0) {
          doc.addPage()
        }

        drawPageFrame(doc)

        const start = pageIndex * CONFIG.ROWS_PER_PAGE
        const end = Math.min(start + CONFIG.ROWS_PER_PAGE, total)
        const pageData = sortedPosList.slice(start, end)

        fillPageData(doc, pageData, pageIndex)

        // 让出控制权，避免阻塞 UI，每 5 页让出一次
        if (pageIndex % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0))
        }
      }

      openPDFInNewWindow(doc)
      messageApi.success('分解单已生成')
      return true
    }
    catch (error) {
      console.error('打印分解单失败:', error)
      messageApi.error(getUserErrorMessage(error, feedbackText.failed('打印', '分解单')))
      return false
    }
    finally {
      setIsPrinting(false)
    }
  }

  return {
    printDecomposition,
    preloadPDF,
    isPrinting,
  }
}
