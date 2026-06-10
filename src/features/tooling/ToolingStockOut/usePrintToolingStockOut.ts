import { useState } from 'react'
import { App } from 'antd'
import autoTable from 'jspdf-autotable'
import dayjs from 'dayjs'

import type { ToolingStockOut } from '@/services/apiToolingStockOut'
import { GOOGLE_FONT_CONFIG } from '@/utils/googleFontLoader'
import { initializePDF, printPDF } from '@/utils/pdfUtils'
import { formatNumber } from '@/utils/format'

const MAX_ROWS_PER_PAGE = 8
const TABLE_START_Y = 30
const HEADER_CELL_HEIGHT = 13
const CELL_PADDING = 2.2
const BODY_CELL_HEIGHT = 15
const COLUMN_WIDTHS = [8, 20, 18, 26, 24, 26, 24, 28, 24, 18, 20, 26] as const
const TABLE_COLUMNS = [
  '#',
  '出库日期',
  '领用人',
  '用途',
  '机器编号',
  '刀具编号',
  '刀具名称',
  '刀具规格',
  '材质',
  '出库数量',
  '最终库存',
  '备注',
] as const

function chunkItems(items: ToolingStockOut[], size: number) {
  const pages: ToolingStockOut[][] = []

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

export function usePrintToolingStockOut() {
  const { message } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  async function printSelected(items: ToolingStockOut[]) {
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

      const fontFamily = GOOGLE_FONT_CONFIG.FONT_FAMILY
      const doc = await initializePDF('l')
      doc.setFont(fontFamily, GOOGLE_FONT_CONFIG.FONT_STYLE)

      const pages = chunkItems(items, MAX_ROWS_PER_PAGE)
      const printDate = dayjs(new Date()).format('YYYY-MM-DD HH:mm')
      const totalQuantity = items.reduce(
        (sum, item) => sum + Number(item.stock_out_quantity || 0),
        0,
      )

      pages.forEach((pageItems, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage()
        }

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        doc.setFont(fontFamily, GOOGLE_FONT_CONFIG.FONT_STYLE)
        doc.setFontSize(20)
        doc.text('刀具出库', pageWidth / 2, 14, { align: 'center' })

        doc.setFontSize(11)
        if (pageIndex === 0) {
          doc.text(`数量合计: ${formatNumber(totalQuantity)}`, 10, 21)
        }
        doc.text(`打印日期: ${printDate}`, pageWidth - 10, 21, {
          align: 'right',
        })

        const tableData = pageItems.map((item, index) => [
          (pageIndex * MAX_ROWS_PER_PAGE + index + 1).toString(),
          formatCellText(item.stock_out_date),
          formatCellText(item.recipient),
          formatCellText(item.purpose),
          formatCellText(item.machine_no),
          formatCellText(item.tool_code),
          formatCellText(item.tool_name),
          formatCellText(item.tool_spec),
          formatCellText(item.material),
          formatNumber(item.stock_out_quantity),
          item.final_stock === null || item.final_stock === undefined
            ? '-'
            : formatNumber(item.final_stock),
          formatCellText(item.remarks),
        ])

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
            fontSize: 9,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            minCellHeight: HEADER_CELL_HEIGHT,
          },
          styles: {
            font: fontFamily,
            fontStyle: GOOGLE_FONT_CONFIG.FONT_STYLE,
            fontSize: 9,
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

      const filename = `刀具出库_${items.length}条_${dayjs(new Date()).format('YYYY-MM-DD_HH-mm-ss')}.pdf`
      const printed = printPDF(doc, filename, printWindow)

      if (printed) {
        message.success('已打开浏览器打印窗口')
      } else {
        message.warning('浏览器阻止了直接打印，已回退为 PDF 预览')
      }
    } catch (error) {
      console.error('打印刀具出库失败:', error)
      message.error('打印失败，请稍后重试')
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    printSelected,
    isPrinting,
  }
}
