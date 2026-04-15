import dayjs from 'dayjs'
import * as XLSX from 'xlsx-js-style'
import type { WorkSheet } from 'xlsx-js-style'

import type { YoumaiFinishedGoodsStockOutImportRow } from '@/services/apiYoumaiFinishedGoodsStockOut'

const REQUIRED_HEADERS = [
  '采购订单号',
  '行号',
  '物料编码',
  '订购数量',
  '交货日期',
] as const

type PurchaseOrderExcelRow = {
  采购订单号?: string | number
  行号?: string | number
  物料编码?: string | number
  物料名称?: string | number
  订购数量?: string | number
  交货日期?: string | number
  订单备注?: string | number
  订单行备注?: string | number
}

export interface ParseYoumaiFinishedGoodsStockOutExcelResult {
  rows: YoumaiFinishedGoodsStockOutImportRow[]
  errors: string[]
}

export async function parseYoumaiFinishedGoodsStockOutExcel(
  file: File,
): Promise<ParseYoumaiFinishedGoodsStockOutExcelResult> {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  validateRequiredHeaders(sheet)

  const excelRows = XLSX.utils.sheet_to_json<PurchaseOrderExcelRow>(sheet, {
    defval: '',
    raw: true,
  })

  const rows: YoumaiFinishedGoodsStockOutImportRow[] = []
  const errors: string[] = []
  const seenOrderLineKeys = new Set<string>()

  excelRows.forEach((row, index) => {
    const rowNumber = index + 2
    const purchaseOrderNo = normalizeText(row['采购订单号'])
    const purchaseOrderLineNo = normalizeText(row['行号'])
    const materialCode = normalizeText(row['物料编码'])
    const materialName = normalizeText(row['物料名称'])
    const stockOutQuantity = normalizeNumber(row['订购数量'])
    const deliveryDate = normalizeDeliveryDate(row['交货日期'])
    const remarks = buildRemarks(row['订单备注'], row['订单行备注'])

    const isEmptyRow =
      !purchaseOrderNo &&
      !purchaseOrderLineNo &&
      !materialCode &&
      row['订购数量'] === '' &&
      !row['交货日期']

    if (isEmptyRow) {
      return
    }

    if (!purchaseOrderNo) {
      errors.push(`第 ${rowNumber} 行缺少采购订单号`)
      return
    }

    if (!purchaseOrderLineNo) {
      errors.push(`第 ${rowNumber} 行缺少行号`)
      return
    }

    if (!materialCode) {
      errors.push(`第 ${rowNumber} 行缺少物料编码`)
      return
    }

    const orderLineKey = `${purchaseOrderNo}__${purchaseOrderLineNo}`
    if (seenOrderLineKeys.has(orderLineKey)) {
      errors.push(
        `第 ${rowNumber} 行采购订单明细“${purchaseOrderNo} / ${purchaseOrderLineNo}”在 Excel 中重复`,
      )
      return
    }

    if (
      stockOutQuantity === null ||
      Number.isNaN(stockOutQuantity) ||
      stockOutQuantity <= 0
    ) {
      errors.push(`第 ${rowNumber} 行订购数量格式无效，需为大于 0 的数字`)
      return
    }

    if (!deliveryDate) {
      errors.push(`第 ${rowNumber} 行交货日期格式无效`)
      return
    }

    seenOrderLineKeys.add(orderLineKey)
    rows.push({
      purchase_order_no: purchaseOrderNo,
      purchase_order_line_no: purchaseOrderLineNo,
      material_code: materialCode,
      material_name: materialName,
      stock_out_quantity: stockOutQuantity,
      delivery_date: deliveryDate,
      remarks,
    })
  })

  if (rows.length === 0 && errors.length === 0) {
    throw new Error('Excel 中没有可导入的采购订单数据')
  }

  return { rows, errors }
}

function validateRequiredHeaders(sheet: WorkSheet) {
  const rows = XLSX.utils.sheet_to_json<Array<string | number | null>>(sheet, {
    header: 1,
    raw: true,
    blankrows: false,
  })

  const headerRow = new Set((rows[0] || []).map((cell) => normalizeText(cell)))
  const missingHeaders = REQUIRED_HEADERS.filter(
    (header) => !headerRow.has(header),
  )

  if (missingHeaders.length > 0) {
    throw new Error(
      `Excel 缺少必要列：${missingHeaders.join('、')}。请使用采购订单导出文件。`,
    )
  }
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeNumber(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  const normalized = normalizeText(value)
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function normalizeDeliveryDate(value: unknown) {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)

    if (!parsed) {
      return null
    }

    return dayjs(`${parsed.y}-${parsed.m}-${parsed.d}`).format('YYYY-MM-DD')
  }

  const normalized = normalizeText(value)
  if (!normalized) {
    return null
  }

  const parsed = dayjs(normalized)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null
}

function buildRemarks(orderRemarks: unknown, orderLineRemarks: unknown) {
  return [normalizeText(orderRemarks), normalizeText(orderLineRemarks)]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 500)
}
