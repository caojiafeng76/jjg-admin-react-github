import { createElement, useState } from 'react'
import { App } from 'antd'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { renderToStaticMarkup } from 'react-dom/server'
import QRCodeImport from 'react-qr-code'
import { initializePDF, printPDF } from '@/utils/pdfUtils'
import { GOOGLE_FONT_CONFIG } from '@/utils/googleFontLoader'
import { getWorkshopOrderQrValue } from './workshopOrderQr'
import type { WorkshopOrder } from './index'

const QRCodeComponent = (
  QRCodeImport as typeof QRCodeImport & {
    default?: typeof QRCodeImport
  }
).default
  ? (
      QRCodeImport as typeof QRCodeImport & {
        default: typeof QRCodeImport
      }
    ).default
  : QRCodeImport

const MAX_ROWS_PER_PAGE = 6
const TABLE_START_Y = 26
const TABLE_BOTTOM_MARGIN = 16
const HEADER_CELL_HEIGHT = 14
const CELL_PADDING = 2
const QR_IMAGE_SIZE = 128
const TITLE_FONT_SIZE = 18
const META_FONT_SIZE = 11
const TABLE_FONT_SIZE = 10
const FOOTER_FONT_SIZE = 11
const COLUMN_WIDTHS = [
  22, 21, 24, 21, 17, 29, 14, 14, 18, 28, 15, 12, 12, 20,
] as const
const TABLE_COLUMNS = [
  '二维码',
  '交货日期',
  '工艺流程',
  '项目号',
  '产品型号',
  '客户型号',
  '长度',
  '订支数',
  '长度公差',
  '料号',
  '表面处理',
  '颜色',
  '行备注',
  ' ',
] as const

const qrImageCache = new Map<string, Promise<string>>()

function formatCellText(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

async function svgMarkupToPngDataUrl(svgMarkup: string) {
  const svgBlob = new Blob([svgMarkup], {
    type: 'image/svg+xml;charset=utf-8',
  })
  const objectUrl = URL.createObjectURL(svgBlob)

  try {
    return await new Promise<string>((resolve, reject) => {
      const image = new Image()

      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = QR_IMAGE_SIZE
        canvas.height = QR_IMAGE_SIZE

        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('二维码画布初始化失败'))
          return
        }

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, QR_IMAGE_SIZE, QR_IMAGE_SIZE)
        context.drawImage(image, 0, 0, QR_IMAGE_SIZE, QR_IMAGE_SIZE)
        resolve(canvas.toDataURL('image/png'))
      }

      image.onerror = () => {
        reject(new Error('二维码图片生成失败'))
      }

      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function getQrImage(orderId: string) {
  const cachedImage = qrImageCache.get(orderId)
  if (cachedImage) {
    return cachedImage
  }

  const qrValue = getWorkshopOrderQrValue(orderId)
  const svgMarkup = renderToStaticMarkup(
    createElement(QRCodeComponent, {
      value: qrValue,
      size: QR_IMAGE_SIZE,
      bgColor: '#FFFFFF',
      fgColor: '#000000',
      level: 'M',
    }),
  )

  const qrImagePromise = svgMarkupToPngDataUrl(svgMarkup)
  qrImageCache.set(orderId, qrImagePromise)

  return qrImagePromise
}

export function usePrintWorkshopOrders() {
  const { message } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  async function generatePDF(selectedOrders: WorkshopOrder[]) {
    if (selectedOrders.length === 0) {
      message.warning('请选择要打印的订单')
      return false
    }

    try {
      setIsPrinting(true)
      const printWindow = window.open('', '_blank')

      if (printWindow) {
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
      }

      const fontFamily = GOOGLE_FONT_CONFIG.FONT_FAMILY
      const doc = await initializePDF('l')
      doc.setFont(fontFamily, GOOGLE_FONT_CONFIG.FONT_STYLE)

      const printDate = format(new Date(), 'yyyy-MM-dd HH:mm')
      const qrImages = new Map<string, string>()

      await Promise.all(
        selectedOrders.map(async (order) => {
          if (!order.id) {
            return
          }

          const qrImage = await getQrImage(order.id)
          qrImages.set(order.id, qrImage)
        }),
      )

      {
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const bodyAreaHeight =
          pageHeight - TABLE_START_Y - TABLE_BOTTOM_MARGIN - HEADER_CELL_HEIGHT
        const minCellHeight = Math.max(
          20,
          Math.floor(bodyAreaHeight / MAX_ROWS_PER_PAGE),
        )

        const drawPageHeader = () => {
          doc.setFont(fontFamily, GOOGLE_FONT_CONFIG.FONT_STYLE)
          doc.setFontSize(TITLE_FONT_SIZE)
          doc.text('车间生产订单', pageWidth / 2, 16, { align: 'center' })

          doc.setFontSize(META_FONT_SIZE)
          doc.text(`打印日期: ${printDate}`, pageWidth - 10, 16, {
            align: 'right',
          })
        }

        const tableData = selectedOrders.map((order) => [
          '',
          formatCellText(order.product_delivery_date),
          formatCellText(order.process_flow),
          formatCellText(order.project_no),
          formatCellText(order.product_model),
          formatCellText(order.customer_model),
          formatCellText(order.length_mm),
          formatCellText(order.order_quantity),
          formatCellText(order.length_tolerance),
          formatCellText(order.material_code),
          formatCellText(order.product_category),
          formatCellText(order.color_name),
          formatCellText(order.row_remark),
          '',
        ])

        autoTable(doc, {
          head: [Array.from(TABLE_COLUMNS)],
          body: tableData,
          theme: 'grid',
          startY: TABLE_START_Y,
          pageBreak: 'auto',
          rowPageBreak: 'avoid',
          showHead: 'everyPage',
          margin: {
            top: TABLE_START_Y,
            right: 5,
            bottom: TABLE_BOTTOM_MARGIN,
            left: 5,
          },
          willDrawPage: drawPageHeader,
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: fontFamily,
            fontStyle: GOOGLE_FONT_CONFIG.FONT_STYLE,
            fontSize: TABLE_FONT_SIZE,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.25,
            minCellHeight: HEADER_CELL_HEIGHT,
          },
          styles: {
            font: fontFamily,
            fontStyle: GOOGLE_FONT_CONFIG.FONT_STYLE,
            fontSize: TABLE_FONT_SIZE,
            overflow: 'linebreak',
            cellPadding: {
              top: CELL_PADDING,
              right: CELL_PADDING,
              bottom: CELL_PADDING,
              left: CELL_PADDING,
            },
            halign: 'left',
            valign: 'middle',
            lineColor: [0, 0, 0],
            lineWidth: 0.25,
            minCellHeight,
          },
          columnStyles: COLUMN_WIDTHS.reduce<
            Record<
              number,
              { cellWidth: number; halign?: 'left' | 'center' | 'right' }
            >
          >((styles, width, columnIndex) => {
            const halign =
              columnIndex === 2 ||
              columnIndex === 3 ||
              columnIndex === 5 ||
              columnIndex === 9 ||
              columnIndex === 12
                ? 'left'
                : 'center'

            styles[columnIndex] = { cellWidth: width, halign }
            return styles
          }, {}),
          didDrawCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 0) {
              return
            }

            const order = selectedOrders[data.row.index]
            if (!order?.id) {
              return
            }

            const qrImage = qrImages.get(order.id)
            if (!qrImage) {
              return
            }

            const imageSize = Math.min(data.cell.width, data.cell.height) - 2
            const imageX = data.cell.x + (data.cell.width - imageSize) / 2
            const imageY = data.cell.y + (data.cell.height - imageSize) / 2

            doc.addImage(qrImage, 'PNG', imageX, imageY, imageSize, imageSize)
          },
        })

        const totalPages = doc.getNumberOfPages()
        for (let pageIndex = 1; pageIndex <= totalPages; pageIndex += 1) {
          doc.setPage(pageIndex)
          doc.setFontSize(FOOTER_FONT_SIZE)
          doc.text(
            `第 ${pageIndex} 页 / 共 ${totalPages} 页`,
            pageWidth - 10,
            pageHeight - 8,
            { align: 'right' },
          )
        }
      }

      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      const filename = `车间订单_${selectedOrders.length}条_${timestamp}.pdf`

      const printed = printPDF(doc, filename, printWindow)

      if (printed) {
        message.success('已打开浏览器打印窗口')
      } else {
        message.warning('浏览器阻止了直接打印，已回退为 PDF 预览')
      }

      return true
    } catch (error) {
      console.error('生成PDF时发生错误:', error)
      message.error(
        error instanceof Error ? error.message : 'PDF生成失败，请重试',
      )
      return false
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    generatePDF,
    isPrinting,
  }
}
