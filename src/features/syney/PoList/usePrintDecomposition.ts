import { useState } from 'react'
import { message } from 'antd'
import jsPDF from 'jspdf'

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
      50, 62, 74, 89, 98, 110, 125, 134, 146, 161, 170, 182, 197, 206, 220, 242,
      257, 270,
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

      xCoords.forEach((x) => doc.line(x, vLineStart, x, vLineEnd))
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
        // 将工艺要求按逗号分割，每个条件另起一行
        const techniqueLines = Technique.split(',').filter((line) => line.trim())
        // 显示所有条件，每个条件另起一行（最多3个，因为只有3个位置）
        techniqueLines.forEach((line, index) => {
          if (index < 3) {
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

      doc.text('橡胶', 273, yBase - 9)

      // 显示备注，确保"贴牌梯,注意不要出现西尼字样"等备注内容正确显示
      if (Remark && Remark !== 'null' && Remark.trim() !== '') {
        doc.text(`${Remark}`, 50, yBase + 17)
      }

      // 填充明细项
      doc.setFontSize(8)

      // 记录"无上下备注"的侧围，用于在上下格子之间平均分配，避免重复
      let genericSideFrameIndex = 0
      
      // 先处理侧围：收集所有侧围item，确定分配，分组汇总
      const sideFrameItems = items.filter(
        (item: ISyneyItem) =>
          item.PartNo?.includes('XN2808ED') || item.PartNo?.includes('XN2838CQ')
      )
      
      // 确定每个侧围item的分配（上/下）
      const sideFrameAssignments: Array<{
        item: ISyneyItem
        isUpper: boolean
        isLower: boolean
      }> = []
      
      sideFrameItems.forEach((item: ISyneyItem) => {
        const remark = item.Remark || ''
        const hasUpFlag =
          remark.includes('上头部') ||
          remark.includes('上部') ||
          remark.includes('上')
        const hasDownFlag =
          remark.includes('下头部') ||
          remark.includes('下部') ||
          remark.includes('下')
        
        let isUpper = false
        let isLower = false
        
        if (hasUpFlag && !hasDownFlag) {
          isUpper = true
        } else if (hasDownFlag && !hasUpFlag) {
          isLower = true
        } else {
          // 无明确标志，交替分配
          const assignToTop = genericSideFrameIndex % 2 === 0
          if (assignToTop) {
            isUpper = true
          } else {
            isLower = true
          }
          genericSideFrameIndex += 1
        }
        
        sideFrameAssignments.push({ item, isUpper, isLower })
      })
      
      // 汇总上侧围和下侧围的数量和规格
      const upperSideFrameItems = sideFrameAssignments.filter((a) => a.isUpper)
      const lowerSideFrameItems = sideFrameAssignments.filter((a) => a.isLower)
      
      const upperSideFrameQty = upperSideFrameItems.reduce(
        (sum, a) => sum + (a.item.Qty || 0),
        0
      )
      const lowerSideFrameQty = lowerSideFrameItems.reduce(
        (sum, a) => sum + (a.item.Qty || 0),
        0
      )
      
      // 获取侧围的规格（取第一个侧围item的规格，如果规格相同的话）
      const firstUpperSideFrame = upperSideFrameItems[0]?.item
      const firstLowerSideFrame = lowerSideFrameItems[0]?.item
      
      // 绘制上侧围（只绘制一次，避免重复）
      if (upperSideFrameQty > 0 && firstUpperSideFrame) {
        const upperSpecText = firstUpperSideFrame.ParamSpec || ''
        const upperSpecVal = upperSpecText.includes('=')
          ? upperSpecText.slice(upperSpecText.indexOf('=') + 1)
          : upperSpecText
        if (upperSpecVal) {
          doc.setFontSize(8)
          doc.text(`${upperSpecVal}*${upperSideFrameQty}`, 259, yBase - 13)
        }
      }
      
      // 绘制下侧围（只绘制一次，避免重复）
      if (lowerSideFrameQty > 0 && firstLowerSideFrame) {
        const lowerSpecText = firstLowerSideFrame.ParamSpec || ''
        const lowerSpecVal = lowerSpecText.includes('=')
          ? lowerSpecText.slice(lowerSpecText.indexOf('=') + 1)
          : lowerSpecText
        if (lowerSpecVal) {
          doc.setFontSize(8)
          doc.text(`${lowerSpecVal}*${lowerSideFrameQty}`, 259, yBase - 4)
        }
      }

      // 先处理后板：收集所有后板item，确定上下分配（不叠加，每个item单独显示）
      // 记录后板items在items数组中的位置，用于分配
      const rearPlateItemsWithIndex: Array<{ item: ISyneyItem; index: number }> = []
      items.forEach((item, index) => {
        const { PartNo } = item
        if (
          PartNo?.includes('XN2808AF') ||
          PartNo?.includes('XN3024Y997') ||
          PartNo?.includes('XN3024BX') ||
          PartNo?.includes('XN3024BY')
        ) {
          rearPlateItemsWithIndex.push({ item, index })
        }
      })

      // 确定每个后板item的上下分配
      const rearPlateAssignments = new Map<ISyneyItem, { isUpper: boolean; isLower: boolean }>()

      // 先处理有明确上下标志的items
      const itemsWithoutFlag: Array<{ item: ISyneyItem; index: number }> = []

      rearPlateItemsWithIndex.forEach(({ item, index }) => {
        const { PartNo, Remark: ItemRemark } = item
        const isRearExtensionOld = PartNo?.includes('XN2808AF')
        const isRearPlateComponent = PartNo?.includes('XN3024Y997')

        const hasUpFlag =
          ItemRemark?.includes('上头部') ||
          ItemRemark?.includes('上部') ||
          ItemRemark?.includes('上')
        const hasDownFlag =
          ItemRemark?.includes('下头部') ||
          ItemRemark?.includes('下部') ||
          ItemRemark?.includes('下')

        let isUpper = false
        let isLower = false

        // 老件号逻辑：通过备注"上头部/下头部"区分
        if (isRearExtensionOld) {
          if (hasUpFlag && !hasDownFlag) isUpper = true
          if (hasDownFlag && !hasUpFlag) isLower = true
        }

        // XN3024BX 视为上后板，XN3024BY 视为下后板
        if (PartNo?.includes('XN3024BX')) isUpper = true
        if (PartNo?.includes('XN3024BY')) isLower = true

        // 新件号：前沿后板组件 XN3024Y997
        if (isRearPlateComponent) {
          if (hasUpFlag && !hasDownFlag) {
            isUpper = true
          } else if (hasDownFlag && !hasUpFlag) {
            isLower = true
          }
        }

        if (isUpper || isLower) {
          rearPlateAssignments.set(item, { isUpper, isLower })
        } else if (isRearExtensionOld || isRearPlateComponent) {
          itemsWithoutFlag.push({ item, index })
        }
      })

      // 处理没有明确标志的items：按在items数组中的顺序，第一块为上后板，第二块为下后板
      // 确保按照原始index排序，保证顺序一致
      itemsWithoutFlag.sort((a, b) => a.index - b.index)
      
      // 如果只有一个item，需要确保显示在上下两个格子
      if (itemsWithoutFlag.length === 1) {
        const item = itemsWithoutFlag[0].item
        // 同时分配到上下格子，打印时会分别显示
        rearPlateAssignments.set(item, {
          isUpper: true,
          isLower: true,
        })
      } else if (itemsWithoutFlag.length >= 2) {
        // 多个items，按顺序分配：第一块 → 上后板，第二块 → 下后板
        const firstItem = itemsWithoutFlag[0].item
        const secondItem = itemsWithoutFlag[1].item
        rearPlateAssignments.set(firstItem, {
          isUpper: true,
          isLower: false,
        })
        rearPlateAssignments.set(secondItem, {
          isUpper: false,
          isLower: true,
        })
      }

      // 先处理后板打印：确保两块后板都能显示
      // 找到上后板和下后板，分别打印
      let upperRearPlateItem: ISyneyItem | undefined
      let lowerRearPlateItem: ISyneyItem | undefined
      
      // 优先查找明确分配到上格子的item
      for (const [item, assignment] of rearPlateAssignments.entries()) {
        if (assignment.isUpper && !upperRearPlateItem) {
          upperRearPlateItem = item
        }
        if (assignment.isLower && !lowerRearPlateItem && !assignment.isUpper) {
          lowerRearPlateItem = item
        }
      }
      
      // 如果没有找到单独的下后板，使用同时分配到上下格子的item（用于Qty=2的情况）
      if (!lowerRearPlateItem) {
        for (const [item, assignment] of rearPlateAssignments.entries()) {
          if (assignment.isLower && assignment.isUpper) {
            lowerRearPlateItem = item
            break
          }
        }
      }

      // 打印上后板
      if (upperRearPlateItem) {
        const upperAssignment = rearPlateAssignments.get(upperRearPlateItem)
        const upperSpecText = upperRearPlateItem.ParamSpec || ''
        // 如果同时分配到上下格子，上格子显示1，否则显示实际数量
        const upperQty = upperAssignment?.isUpper && upperAssignment?.isLower ? 1 : (upperRearPlateItem.Qty || 0)
        if (upperQty > 0 && upperSpecText) {
          doc.setFontSize(8)
          doc.text(upperSpecText, 147, yBase - 13)
          doc.setFontSize(12)
          doc.text(`${upperQty}`, 164, yBase - 13)
        }
      }

      // 打印下后板
      if (lowerRearPlateItem) {
        const lowerAssignment = rearPlateAssignments.get(lowerRearPlateItem)
        const lowerSpecText = lowerRearPlateItem.ParamSpec || ''
        // 如果同时分配到上下格子，下格子显示1，否则显示实际数量
        const lowerQty = lowerAssignment?.isUpper && lowerAssignment?.isLower ? 1 : (lowerRearPlateItem.Qty || 0)
        if (lowerQty > 0 && lowerSpecText) {
          doc.setFontSize(8)
          doc.text(lowerSpecText, 147, yBase - 4)
          doc.setFontSize(12)
          doc.text(`${lowerQty}`, 164, yBase - 4)
        }
      }

      // 遍历所有items，处理其他组件（排除侧围和后板，因为已经处理过了）
      items.forEach((item: ISyneyItem) => {
        // 跳过侧围和后板，因为已经在上面处理过了
        if (
          item.PartNo?.includes('XN2808ED') ||
          item.PartNo?.includes('XN2838CQ') ||
          rearPlateAssignments.has(item)
        ) {
          return
        }

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
          PartNo?.includes('XN3024DF') ||
          PartNo?.includes('XN3024AP')
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
          PartNo?.includes('XN3024DG') ||
          PartNo?.includes('XN3024AQ')
        ) {
          doc.setFontSize(8)
          doc.text(specText, 111, yBase - 4)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 128, yBase - 4)
        }

        // 上加长板
        if (
          (PartNo?.includes('XN2808AL') && ItemRemark?.includes('上头部')) ||
          (PartNo?.includes('XN3024X997') && 
            (ItemRemark?.includes('上头部') || 
             ItemRemark?.includes('上部') || 
             ItemRemark?.includes('上') ||
             (!ItemRemark?.includes('下头部') && !ItemRemark?.includes('下部') && !ItemRemark?.includes('下'))))
        ) {
          doc.setFontSize(8)
          doc.text(specText, 183, yBase - 13)
          doc.setFontSize(12)
          doc.text(`${Qty}`, 200, yBase - 13)
        }

        // 下加长板
        if (
          (PartNo?.includes('XN2808AL') && ItemRemark?.includes('下头部')) ||
          (PartNo?.includes('XN3024X997') && 
            (ItemRemark?.includes('下头部') || 
             ItemRemark?.includes('下部') || 
             ItemRemark?.includes('下')))
        ) {
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
      // 1. 初始化 PDF（现在是异步的）
      const doc = await initializePDF('l')

      // 2. 字体已通过 initializePDF 设置（使用 Google Font）

      // 3. 直接使用数据库中的 ParamSpec（不再处理，因为创建时已保存）
      // 按合同号升序排序
      const sortedPosList = [...selectedPosList].sort((a, b) => {
        const sonoA = a.poInfo.SONo || ''
        const sonoB = b.poInfo.SONo || ''
        return sonoA.localeCompare(sonoB, 'zh-CN', { numeric: true })
      })

      // 4. 计算分页
      const total = sortedPosList.length
      const totalPages = Math.ceil(total / CONFIG.ROWS_PER_PAGE)

      // 5. 生成每一页
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
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      // 6. 输出 PDF
      openPDFInNewWindow(doc)
      messageApi.success('打印完成')
    } catch (error) {
      console.error('打印分解单失败:', error)
      messageApi.error('打印失败，请重试')
    } finally {
      setIsPrinting(false)
    }
  }

  return { printDecomposition, contextHolder, isPrinting, messageApi }
}
