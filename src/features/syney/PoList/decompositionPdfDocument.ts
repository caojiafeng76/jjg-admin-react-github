import type jsPDF from 'jspdf'
import type { SelectedSyneyPoWithItems } from '@/services/apiSyneyPos'
import type { SyneySafePartSetting } from '@/services/apiSyneySafePartSettings'
import type { DecompositionCell } from '@/utils/syneyDecomposition'

import { initializePDF, openPDFInNewWindow } from '@/utils/pdfUtils'
import { buildDecompositionCells } from '@/utils/syneyDecomposition'

const CONFIG = {
  ROWS_PER_PAGE: 4,
  ROW_HEIGHT: 40,
  BASE_Y: 60, // 第一行数据的基准 Y 坐标
  MAX_TECHNIQUE_LINES: 3, // 工艺要求最多显示行数（受 PDF 格子高度限制）
} as const

function stripSpecPrefix(spec: string) {
  return spec.includes('=') ? spec.slice(spec.indexOf('=') + 1) : spec
}

/** 绘制踏板分解单页面框架（表头、线条、固定文本） */
function drawPageFrame(doc: jsPDF) {
  doc.setFontSize(20)
  // 居中标题：15 + 270/2 = 150
  doc.text('踏板分解单', 150, 20, { align: 'center' })

  doc.rect(15, 30, 270, 170)
  doc.line(15, 40, 285, 40)

  doc.setFontSize(10)

  doc.text('序号', 21.5, 37, { align: 'center' })
  doc.line(28, 30, 28, 40)

  doc.text('交货日期', 39, 37, { align: 'center' })
  doc.line(50, 30, 50, 40)

  doc.text('台数', 56, 37, { align: 'center' })
  doc.line(62, 30, 62, 40)

  doc.text('名称', 68, 37, { align: 'center' })
  doc.line(74, 30, 74, 40)

  doc.text('规格', 81.5, 37, { align: 'center' })
  doc.line(89, 30, 89, 40)

  doc.text('件数', 93.5, 37, { align: 'center' })
  doc.line(98, 30, 98, 40)

  doc.text('名称', 104, 37, { align: 'center' })
  doc.line(110, 30, 110, 40)

  doc.text('规格', 117.5, 37, { align: 'center' })
  doc.line(125, 30, 125, 40)

  doc.text('件数', 129.5, 37, { align: 'center' })
  doc.line(134, 30, 134, 40)

  doc.text('名称', 140, 37, { align: 'center' })
  doc.line(146, 30, 146, 40)

  doc.text('规格', 153.5, 37, { align: 'center' })
  doc.line(161, 30, 161, 40)

  doc.text('件数', 165.5, 37, { align: 'center' })
  doc.line(170, 30, 170, 40)

  doc.text('名称', 176, 37, { align: 'center' })
  doc.line(182, 30, 182, 40)

  doc.text('规格', 189.5, 37, { align: 'center' })
  doc.line(197, 30, 197, 40)

  doc.text('件数', 201.5, 37, { align: 'center' })
  doc.line(206, 30, 206, 40)

  doc.text('类型', 213, 37, { align: 'center' })
  doc.line(220, 30, 220, 40)

  doc.text('工艺要求', 231, 37, { align: 'center' })
  doc.line(242, 30, 242, 40)

  doc.text('横 围', 249.5, 37, { align: 'center' })
  doc.line(257, 30, 257, 40)

  doc.text('侧 围', 263.5, 37, { align: 'center' })
  doc.line(270, 30, 270, 40)

  doc.text('围框垫', 277.5, 37, { align: 'center' })

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
    const yLine1 = yBase
    const yLine2 = yBase + 10

    doc.line(28, yLine1, 285, yLine1)
    doc.line(28, yLine2, 285, yLine2)

    doc.line(110, yBase - 10, 134, yBase - 10)
    doc.line(146, yBase - 10, 170, yBase - 10)
    doc.line(182, yBase - 10, 206, yBase - 10)
    doc.line(257, yBase - 10, 270, yBase - 10)

    const vLineStart = yBase - 20
    const vLineEnd = yBase
    xCoords.forEach(x => doc.line(x, vLineStart, x, vLineEnd))
  }

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

  doc.setFontSize(12)
  for (let i = 0; i < CONFIG.ROWS_PER_PAGE; i++) {
    const yBase = CONFIG.BASE_Y + i * CONFIG.ROW_HEIGHT
    doc.text('加', 176, yBase - 16, { align: 'center' })
    doc.text('长', 176, yBase - 9, { align: 'center' })
    doc.text('板', 176, yBase - 2, { align: 'center' })
  }

  doc.setFontSize(10)
  for (let i = 0; i < CONFIG.ROWS_PER_PAGE; i++) {
    const yBase = CONFIG.BASE_Y + i * CONFIG.ROW_HEIGHT
    doc.text('订单号：', 30, yBase + 7)
    doc.text('商标：', 85, yBase + 7)
    doc.text('编号：', 155, yBase + 7)
    doc.text('合同号：', 200, yBase + 7)
    doc.text('备注：', 30, yBase + 17)
  }

  doc.line(28, 40, 28, 200)

  for (let i = 1; i < CONFIG.ROWS_PER_PAGE; i++) {
    const y = 40 + i * CONFIG.ROW_HEIGHT
    doc.line(15, y, 285, y)
  }
}

function drawDecompositionCell(
  doc: jsPDF,
  cell: DecompositionCell | undefined,
  specX: number,
  qtyX: number,
  y: number,
) {
  if (!cell) {
    return
  }

  doc.setFontSize(8)
  doc.text(cell.spec, specX, y)
  doc.setFontSize(12)
  doc.text(`${cell.qty}`, qtyX, y)
}

function fillPageData(
  doc: jsPDF,
  data: SelectedSyneyPoWithItems[],
  pageIndex: number,
  safePartSettings: SyneySafePartSetting[],
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
    doc.text(`${pageIndex * CONFIG.ROWS_PER_PAGE + i + 1}`, 20, yBase + 1)
    doc.text('1', 55, yBase - 9)

    doc.setFontSize(10)
    doc.text(`${EndDate ? EndDate.substring(0, 10) : ''}`, 30, yBase - 9)
    doc.text(`${No || ''}`, 50, yBase + 7)
    doc.text(`${SONo || ''}`, 220, yBase + 7)
    doc.text(`${SerialNo ?? ''}`, 175, yBase + 7)
    doc.text(`${Brand || ''}`, 105, yBase + 7)

    if (Technique && Technique !== 'null') {
      const techniqueLines = Technique.split(',').filter(line => line.trim())
      techniqueLines.forEach((line, index) => {
        if (index < CONFIG.MAX_TECHNIQUE_LINES) {
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

    if (Remark && Remark !== 'null' && Remark.trim() !== '') {
      doc.text(`${Remark}`, 50, yBase + 17)
    }

    const decompositionCells = buildDecompositionCells(items, safePartSettings)
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

    drawDecompositionCell(doc, decompositionCells.frontPlate, 75, 92, yBase - 9)
    drawDecompositionCell(doc, decompositionCells.upperMiddle, 111, 128, yBase - 13)
    drawDecompositionCell(doc, decompositionCells.lowerMiddle, 111, 128, yBase - 4)
    drawDecompositionCell(doc, decompositionCells.rearUpper, 147, 164, yBase - 13)
    drawDecompositionCell(doc, decompositionCells.rearLower, 147, 164, yBase - 4)
    drawDecompositionCell(doc, decompositionCells.extensionUpper, 183, 200, yBase - 13)
    drawDecompositionCell(doc, decompositionCells.extensionLower, 183, 200, yBase - 4)

    if (crossFrame) {
      const crossFrameSpec = stripSpecPrefix(crossFrame.spec)
      if (crossFrameSpec) {
        doc.setFontSize(8)
        doc.text(`${crossFrameSpec}*${crossFrame.qty}`, 244, yBase - 9)
      }
    }
  })
}

export async function generateDecompositionPDF(
  selectedPosList: SelectedSyneyPoWithItems[],
  safePartSettings: SyneySafePartSetting[],
) {
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

    fillPageData(doc, pageData, pageIndex, safePartSettings)

    // 每 5 页让出一次控制权，避免长任务阻塞 UI
    if (pageIndex % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  openPDFInNewWindow(doc)
}
