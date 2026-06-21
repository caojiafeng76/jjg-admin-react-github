import { useCallback, useState } from 'react'
import { App } from 'antd'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'

import { downloadWorkshopOrderSketchFile } from '@/services/apiWorkshopOrders'
import {
  applyRegisterSheetStyles,
  EXCEL_WRITE_OPTIONS,
} from '@/utils/excelStyleUtils'
import {
  embedSketchFilesIntoFirstWorksheet,
  type WorksheetSketchPlacement,
} from '@/utils/workshopOrderSketchXlsx'
import type { WorkshopOrder } from './index'
import { getWorkshopOrderQrPngData } from './workshopOrderQrImage'

const SHEET_NAME = '车间订单'
const WORKBOOK_TITLE = '精加工车间生产订单'
const HEADER_ROW_HEIGHT = 24
const BODY_ROW_HEIGHT = 68

const EXCEL_HEADERS = [
  '二维码',
  '简图',
  '交货日期',
  '结案时间',
  '工艺流程',
  '客户',
  '项目号',
  '产品型号',
  '客户型号',
  '比重',
  '长度(mm)',
  '长度公差',
  '支数',
  '表面处理',
  '颜色',
  '包装方式',
  '材质',
  '料号',
  '行备注',
] as const

const COLUMN_WIDTHS = [
  14, 14, 12, 18, 18, 14, 14, 14, 24, 9, 10, 12, 8, 12, 10, 12, 12, 18, 20,
]

function formatCellText(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function formatClosedAt(value: WorkshopOrder['closed_at']) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : ''
}

function getExtensionFromPath(path: string) {
  return path.split('.').pop()?.toLowerCase() || 'emf'
}

function getMimeType(extension: string) {
  switch (extension) {
    case 'emf':
      return 'image/x-emf'
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    default:
      return 'application/octet-stream'
  }
}

async function buildSketchPlacements(
  orders: WorkshopOrder[],
): Promise<WorksheetSketchPlacement[]> {
  const placements: WorksheetSketchPlacement[] = []

  for (let index = 0; index < orders.length; index += 1) {
    const order = orders[index]
    const filePath = order.sketch_file_path

    if (!filePath) {
      continue
    }

    const extension = getExtensionFromPath(filePath)
    placements.push({
      rowNumber: index + 3,
      columnNumber: 2,
      fileName: filePath.split('/').pop() || `sketch-${index + 1}.${extension}`,
      extension,
      mimeType: getMimeType(extension),
      data: await downloadWorkshopOrderSketchFile(filePath),
    })
  }

  return placements
}

async function buildQrPlacements(
  orders: WorkshopOrder[],
): Promise<WorksheetSketchPlacement[]> {
  const placements: WorksheetSketchPlacement[] = []

  for (let index = 0; index < orders.length; index += 1) {
    const order = orders[index]
    if (!order.id) {
      continue
    }

    placements.push({
      rowNumber: index + 3,
      columnNumber: 1,
      fileName: `order-qr-${order.id}.png`,
      extension: 'png',
      mimeType: 'image/png',
      data: await getWorkshopOrderQrPngData(order.id),
    })
  }

  return placements
}

function downloadExcel(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function createWorkshopOrderWorkbookBuffer(orders: WorkshopOrder[]) {
  const workbook = XLSX.utils.book_new()
  const rows = orders.map((order) => [
    '',
    '',
    formatCellText(order.product_delivery_date),
    formatClosedAt(order.closed_at),
    formatCellText(order.process_flow),
    formatCellText(order.customer),
    formatCellText(order.project_no),
    formatCellText(order.product_model),
    formatCellText(order.customer_model),
    formatCellText(order.weight_per_meter_kg),
    formatCellText(order.length_mm),
    formatCellText(order.length_tolerance),
    formatCellText(order.order_quantity),
    formatCellText(order.product_category),
    formatCellText(order.color_name),
    formatCellText(order.package_name),
    formatCellText(order.material_name),
    formatCellText(order.material_code),
    formatCellText(order.row_remark),
  ])
  const data = [
    [WORKBOOK_TITLE, ...EXCEL_HEADERS.slice(1).map(() => '')],
    Array.from(EXCEL_HEADERS),
    ...rows,
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(data)

  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: EXCEL_HEADERS.length - 1 },
    },
  ]
  applyRegisterSheetStyles(worksheet, data, {
    columnWidths: COLUMN_WIDTHS,
    headerRowHeight: HEADER_ROW_HEIGHT,
    bodyRowHeight: BODY_ROW_HEIGHT,
  })
  XLSX.utils.book_append_sheet(workbook, worksheet, SHEET_NAME)

  return XLSX.write(workbook, {
    ...EXCEL_WRITE_OPTIONS,
    type: 'array',
    bookType: 'xlsx',
  }) as ArrayBuffer
}

export function useExportWorkshopOrdersAsExcel() {
  const { message } = App.useApp()
  const [isExporting, setIsExporting] = useState(false)

  const exportAsExcel = useCallback(
    async (orders: WorkshopOrder[]) => {
      if (!orders.length) {
        message.warning('请选择要导出的订单')
        return false
      }

      setIsExporting(true)

      try {
        const workbookBuffer = createWorkshopOrderWorkbookBuffer(orders)
        const placements = [
          ...(await buildQrPlacements(orders)),
          ...(await buildSketchPlacements(orders)),
        ]
        const outputBuffer = await embedSketchFilesIntoFirstWorksheet(
          workbookBuffer,
          placements,
        )

        downloadExcel(
          outputBuffer,
          `车间订单_${dayjs(new Date()).format('YYYY-MM-DD')}.xlsx`,
        )
        message.success('订单 Excel 导出成功')
        return true
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : '订单 Excel 导出失败',
        )
        return false
      } finally {
        setIsExporting(false)
      }
    },
    [message],
  )

  return { exportAsExcel, isExporting }
}
