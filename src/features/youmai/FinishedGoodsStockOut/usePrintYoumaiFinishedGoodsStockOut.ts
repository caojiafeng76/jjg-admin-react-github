import { useState } from 'react'
import { App } from 'antd'
import dayjs from 'dayjs'

import type { YoumaiFinishedGoodsStockOut } from '@/services/apiYoumaiFinishedGoodsStockOut'
import { GOOGLE_FONT_CONFIG } from '@/utils/googleFontLoader'
import { calculateYoumaiWeightKg } from '@/utils/youmaiWeight'

const loadYoumaiFinishedGoodsStockOutPdfRuntime = () =>
  Promise.all([import('jspdf-autotable'), import('@/utils/pdfUtils')] as const)

function preloadPrint() {
  void loadYoumaiFinishedGoodsStockOutPdfRuntime()
}

function formatNumber(value: number | null | undefined, digits = 3) {
  return Number(value ?? 0).toFixed(digits)
}

const MAX_ROWS_PER_PAGE = 6
const TABLE_START_Y = 30
const HEADER_CELL_HEIGHT = 15
const CELL_PADDING = 2.4
const BODY_CELL_HEIGHT = 18
const COLUMN_WIDTHS = [10, 22, 40, 12, 28, 40, 20, 20, 18, 22, 22] as const
const TABLE_COLUMNS = [
  '#',
  '交货日期',
  '采购订单号',
  '行号',
  '物料编码',
  '物料名称',
  '型号',
  '规格',
  '出库数量',
  '重量(KG)',
  '最终库存',
] as const

function chunkItems(items: YoumaiFinishedGoodsStockOut[], size: number) {
  const pages: YoumaiFinishedGoodsStockOut[][] = []

  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size))
  }

  return pages
}

function formatCellText(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return '-'
  }

  return String(value)
}

export function usePrintYoumaiFinishedGoodsStockOut() {
  const { message } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  async function printSelected(items: YoumaiFinishedGoodsStockOut[]) {
    if (items.length === 0) {
      message.warning('请选择要打印的出库数据')
      return
    }

    setIsPrinting(true)

    try {
      const printWindow = window.open('', '_blank')

      if (!printWindow) {
        message.warning('浏览器阻止了打印窗口，请允许弹窗后重试')
        return
      }

      printWindow.document.open()
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="zh-CN">
          <head>
            <meta charset="UTF-8" />
            <title>正在准备打印...</title>
            <style>
              body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: sans-serif;
                color: #555;
                background: #f5f5f5;
              }
            </style>
          </head>
          <body>正在生成打印内容，请稍候...</body>
        </html>
      `)
      printWindow.document.close()

      const [{ default: autoTable }, { initializePDF, printPDF }] =
        await loadYoumaiFinishedGoodsStockOutPdfRuntime()
      const fontFamily = GOOGLE_FONT_CONFIG.FONT_FAMILY
      const doc = await initializePDF('l')
      doc.setFont(fontFamily, GOOGLE_FONT_CONFIG.FONT_STYLE)

      const pages = chunkItems(items, MAX_ROWS_PER_PAGE)
      const printDate = dayjs(new Date()).format('YYYY-MM-DD HH:mm')
      const totalWeight = items.reduce((sum, item) => {
        const weight = calculateYoumaiWeightKg({
          specification: item.specification,
          specificGravity: item.specific_gravity,
          quantity: item.stock_out_quantity,
        })

        return sum + (weight ?? 0)
      }, 0)

      pages.forEach((pageItems, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage()
        }

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        doc.setFont(fontFamily, GOOGLE_FONT_CONFIG.FONT_STYLE)
        doc.setFontSize(20)
        doc.text('优迈成品出库', pageWidth / 2, 14, { align: 'center' })

        doc.setFontSize(11)
        if (pageIndex === 0) {
          doc.text(`重量合计: ${formatNumber(totalWeight)} KG`, 10, 21)
        }
        doc.text(`打印日期: ${printDate}`, pageWidth - 10, 21, {
          align: 'right',
        })

        const tableData = pageItems.map((item, index) => {
          const weight = calculateYoumaiWeightKg({
            specification: item.specification,
            specificGravity: item.specific_gravity,
            quantity: item.stock_out_quantity,
          })

          return [
            (pageIndex * MAX_ROWS_PER_PAGE + index + 1).toString(),
            formatCellText(item.delivery_date),
            formatCellText(item.purchase_order_no),
            formatCellText(item.purchase_order_line_no),
            formatCellText(item.material_code),
            formatCellText(item.material_name),
            formatCellText(item.model),
            formatCellText(item.specification),
            formatNumber(item.stock_out_quantity),
            weight === null ? '-' : formatNumber(weight),
            item.final_stock === null || item.final_stock === undefined
              ? '-'
              : formatNumber(item.final_stock),
          ]
        })

        autoTable(doc, {
          head: [Array.from(TABLE_COLUMNS)],
          body: tableData,
          theme: 'grid',
          startY: TABLE_START_Y,
          pageBreak: 'auto',
          rowPageBreak: 'avoid',
          margin: { top: TABLE_START_Y, right: 10, bottom: 12, left: 10 },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: fontFamily,
            fontStyle: GOOGLE_FONT_CONFIG.FONT_STYLE,
            fontSize: 10,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            minCellHeight: HEADER_CELL_HEIGHT,
          },
          styles: {
            font: fontFamily,
            fontStyle: GOOGLE_FONT_CONFIG.FONT_STYLE,
            fontSize: 10,
            overflow: 'linebreak',
            cellPadding: {
              top: CELL_PADDING,
              right: CELL_PADDING,
              bottom: CELL_PADDING,
              left: CELL_PADDING,
            },
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            minCellHeight: BODY_CELL_HEIGHT,
          },
          columnStyles: COLUMN_WIDTHS.reduce<
            Record<number, { cellWidth: number }>
          >((styles, width, columnIndex) => {
            styles[columnIndex] = { cellWidth: width }
            return styles
          }, {}),
        })

        doc.setFontSize(11)
        doc.text(
          `第 ${pageIndex + 1} 页 / 共 ${pages.length} 页`,
          pageWidth - 10,
          pageHeight - 8,
          { align: 'right' },
        )
      })

      const filename = `优迈成品出库_${items.length}条_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.pdf`
      const printed = printPDF(doc, filename, printWindow)

      if (printed) {
        message.success('已打开浏览器打印窗口')
      } else {
        message.warning('浏览器阻止了直接打印，已回退为 PDF 预览')
      }
    } catch (error) {
      console.error('打印优迈成品出库失败:', error)
      message.error('打印失败，请稍后重试')
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    printSelected,
    isPrinting,
    preloadPrint,
  }
}
