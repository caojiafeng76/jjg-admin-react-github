import { createElement, useState } from 'react'
import { App } from 'antd'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { renderToStaticMarkup } from 'react-dom/server'
import QRCodeImport from 'react-qr-code'
import { initializePDF } from '@/utils/pdfUtils'
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

const MAX_ROWS_PER_PAGE = 5
const TABLE_START_Y = 24
const TABLE_BOTTOM_MARGIN = 16
const HEADER_CELL_HEIGHT = 12
const CELL_PADDING = 2
const QR_IMAGE_SIZE = 96
const COLUMN_WIDTHS = [14, 30, 28, 32, 38, 20, 34, 18, 28, 35] as const
const TABLE_COLUMNS = [
  '序号',
  '二维码',
  '交货日期',
  '项目号',
  '产品型号',
  '长度(mm)',
  '客户型号',
  '订支数',
  '料号',
  ' ',
] as const

const qrImageCache = new Map<string, Promise<string>>()

function chunkOrders(orders: WorkshopOrder[], size: number) {
  const pages: WorkshopOrder[][] = []

  for (let index = 0; index < orders.length; index += size) {
    pages.push(orders.slice(index, index + size))
  }

  return pages
}

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

      const fontFamily = GOOGLE_FONT_CONFIG.FONT_FAMILY
      const doc = await initializePDF('l')
      doc.setFont(fontFamily, GOOGLE_FONT_CONFIG.FONT_STYLE)

      const pages = chunkOrders(selectedOrders, MAX_ROWS_PER_PAGE)
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

      pages.forEach((pageOrders, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage()
        }

        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        const bodyAreaHeight =
          pageHeight - TABLE_START_Y - TABLE_BOTTOM_MARGIN - HEADER_CELL_HEIGHT
        const minCellHeight = Math.max(
          28,
          Math.floor(bodyAreaHeight / Math.max(pageOrders.length, 1)),
        )

        doc.setFont(fontFamily, GOOGLE_FONT_CONFIG.FONT_STYLE)
        doc.setFontSize(16)
        doc.text('车间生产订单', pageWidth / 2, 14, { align: 'center' })

        doc.setFontSize(10)
        doc.text(`打印日期: ${printDate}`, pageWidth - 10, 14, {
          align: 'right',
        })

        const tableData = pageOrders.map((order, rowIndex) => [
          (pageIndex * MAX_ROWS_PER_PAGE + rowIndex + 1).toString(),
          '',
          formatCellText(order.product_delivery_date),
          formatCellText(order.project_no),
          formatCellText(order.product_model),
          formatCellText(order.length_mm),
          formatCellText(order.customer_model),
          formatCellText(order.order_quantity),
          formatCellText(order.material_code),
          '',
        ])

        autoTable(doc, {
          head: [Array.from(TABLE_COLUMNS)],
          body: tableData,
          theme: 'grid',
          startY: TABLE_START_Y,
          pageBreak: 'avoid',
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
            minCellHeight,
          },
          columnStyles: COLUMN_WIDTHS.reduce<Record<number, { cellWidth: number }>>(
            (styles, width, columnIndex) => {
              styles[columnIndex] = { cellWidth: width }
              return styles
            },
            {},
          ),
          didDrawCell: (data) => {
            if (data.section !== 'body' || data.column.index !== 1) {
              return
            }

            const order = pageOrders[data.row.index]
            if (!order?.id) {
              return
            }

            const qrImage = qrImages.get(order.id)
            if (!qrImage) {
              return
            }

            const imageSize = Math.min(data.cell.width, data.cell.height) - 4
            const imageX = data.cell.x + (data.cell.width - imageSize) / 2
            const imageY = data.cell.y + (data.cell.height - imageSize) / 2

            doc.addImage(qrImage, 'PNG', imageX, imageY, imageSize, imageSize)
          },
        })

        doc.setFontSize(10)
        doc.text(
          `第 ${pageIndex + 1} 页 / 共 ${pages.length} 页`,
          pageWidth - 10,
          pageHeight - 8,
          { align: 'right' },
        )
      })

      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      const filename = `车间订单_${selectedOrders.length}条_${timestamp}.pdf`

      doc.save(filename)

      message.success(`PDF生成成功: ${filename}`)
      return true
    } catch (error) {
      console.error('生成PDF时发生错误:', error)
      message.error(error instanceof Error ? error.message : 'PDF生成失败，请重试')
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

