import XLSX from 'xlsx-js-style'

import type { ProductionSchedulingOrder } from '@/services/apiProductionScheduling'
import { EXCEL_WRITE_OPTIONS, setColumnWidths } from './excelStyleUtils'

const BORDER_COLOR = '000000'
const TITLE_FILL = 'D9EAF7'
const HEADER_FILL = 'F2F2F2'

type SheetCellValue = string | number | null
type WorksheetData = SheetCellValue[][]

function getColumnLetter(columnIndex: number) {
  let letter = ''
  let index = columnIndex

  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter
    index = Math.floor(index / 26) - 1
  }

  return letter
}

function normalizeNumber(value: number | null | undefined) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`
}

function formatChineseDate(value: Date) {
  return `${value.getFullYear()}年${value.getMonth() + 1}月${value.getDate()}日`
}

function toCellText(value: unknown, transform?: (raw: string) => string) {
  if (value === null || value === undefined) {
    return '-'
  }

  const text = typeof value === 'string' ? value.trim() : String(value)
  if (!text) {
    return '-'
  }

  return transform ? transform(text) : text
}

function getProgressText(order: ProductionSchedulingOrder) {
  const status = order.progress_status?.trim()
  const orderQuantity = Number(order.order_quantity || 0)
  const transferQuantity = Number(order.transfer_quantity || 0)

  if (status === '延期') {
    return '延期'
  }

  if (orderQuantity > 0 && transferQuantity >= orderQuantity) {
    return '已完工'
  }

  if (transferQuantity > 0) {
    return `进行中(${order.transfer_rate.toFixed(1)}%)`
  }

  return status || '未开工'
}

function getPlanPeriod(orders: ProductionSchedulingOrder[]) {
  const dates = orders
    .flatMap((order) => [order.planned_start_date, order.planned_finish_date])
    .filter((value): value is string => Boolean(value))
    .sort()

  if (dates.length === 0) {
    return ''
  }

  return `${formatDate(dates[0])} - ${formatDate(dates[dates.length - 1])}`
}

function applyCommonStyles(
  worksheet: XLSX.WorkSheet,
  data: WorksheetData,
  columnWidths: number[],
  titleEndColumn: number,
) {
  setColumnWidths(worksheet, columnWidths)

  const rowCount = data.length
  const colCount = Math.max(...data.map((row) => row.length))

  worksheet['!rows'] = data.map((_, index) => ({
    hpx: index === 0 ? 32 : index === rowCount - 1 ? 44 : 26,
  }))

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const cellRef = `${getColumnLetter(colIndex)}${rowIndex + 1}`

      if (!worksheet[cellRef]) {
        worksheet[cellRef] = { v: '' }
      }

      worksheet[cellRef].s = {
        ...(worksheet[cellRef].s || {}),
        font: {
          name: '宋体',
          sz: rowIndex === 0 ? 16 : 11,
          bold: rowIndex <= 1,
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
          wrapText: true,
        },
        border: {
          top: { style: 'thin', color: { rgb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
          left: { style: 'thin', color: { rgb: BORDER_COLOR } },
          right: { style: 'thin', color: { rgb: BORDER_COLOR } },
        },
      }

      if (rowIndex === 0) {
        worksheet[cellRef].s.fill = { fgColor: { rgb: TITLE_FILL } }
      }

      if (rowIndex === 1) {
        worksheet[cellRef].s.fill = { fgColor: { rgb: HEADER_FILL } }
      }
    }
  }

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: titleEndColumn } },
  ]
  worksheet['!freeze'] = { xSplit: 0, ySplit: 2 }
}

function createBasicInfoSheet(orders: ProductionSchedulingOrder[]) {
  const today = new Date()
  const data: WorksheetData = [
    ['精加工车间订单排产计划表 - 基础信息', null, null],
    ['字段名称', '填写内容/说明', '备注'],
    ['*计划表编号', `PC-${today.getTime()}`, 'ERP自动生成或手工编号'],
    ['*排产日期', formatChineseDate(today), ''],
    ['排产周期', getPlanPeriod(orders), ''],
    ['*填报人', '', ''],
    ['*审核人', '', '需由车间主任审核'],
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(data)

  applyCommonStyles(worksheet, data, [20, 36, 28], 2)

  return worksheet
}

function createDetailSheet(orders: ProductionSchedulingOrder[]) {
  const headers = [
    '*订单编号',
    '*项目号',
    '*客户名称',
    '*型号',
    '*客户型号',
    '*物料名称',
    '*料号',
    '*长度',
    '*颜色',
    '*订单数量',
    '*合格标准',
    '*计划开工时间',
    '*计划完工时间',
    '*交付日期',
    '*分配设备(ERP编号)',
    '*负责班组/人员',
    '当前进度',
    '转移数量',
    '转移进度',
    '最近转移车间',
    '最近转移时间',
    '备注',
  ]
  const data: WorksheetData = [
    ['订单排产核心详情表', ...headers.slice(1).map(() => null)],
    headers,
    ...orders.map((order) => [
      order.id?.slice(0, 8) || '',
      order.project_no || '',
      order.customer || '',
      toCellText(order.product_model),
      toCellText(order.customer_model),
      toCellText(order.material_name),
      toCellText(order.material_code),
      toCellText(order.length_mm, (raw) => `${raw}mm`),
      toCellText(order.color_name),
      normalizeNumber(order.order_quantity),
      order.process_requirement || '',
      formatDate(order.planned_start_date),
      formatDate(order.planned_finish_date),
      formatDate(order.product_delivery_date),
      order.tooling_status || '',
      (order.responsible_person_names?.length
        ? order.responsible_person_names.join('、')
        : order.responsible_person) || '',
      getProgressText(order),
      normalizeNumber(order.transfer_quantity),
      `${Number(order.transfer_rate || 0).toFixed(1)}%`,
      order.transfer_latest_workshop || '',
      formatDate(order.transfer_latest_date),
      order.scheduling_remark || '',
    ]),
    [
      '填写提示：1. 分配设备需填写ERP备案设备编号；2. 进度需每日更新并同步至ERP；3. 此表可根据实际订单数量向下无限新增行。',
      ...headers.slice(1).map(() => null),
    ],
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(data)

  applyCommonStyles(
    worksheet,
    data,
    [12, 16, 14, 14, 14, 14, 14, 10, 10, 12, 20, 16, 16, 16, 22, 18, 20, 12, 12, 16, 18, 28],
    headers.length - 1,
  )
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    {
      s: { r: data.length - 1, c: 0 },
      e: { r: data.length - 1, c: headers.length - 1 },
    },
  ]

  return worksheet
}

function createResourceSheet() {
  const data: WorksheetData = [
    ['生产资源配置表', null, null],
    ['资源类别', '详细配置信息', '说明/要求'],
    ['设备资源', '设备编号、运行状态：', '需与ERP设备管理模块一致'],
    ['物料资源', '物料名称、规格、库存量：', '需与ERP物料模块同步'],
    ['人力配置', '班组数量、在岗人数、技能适配情况：', ''],
    ['工装夹具', '所需工装夹具型号、数量、完好状态：', ''],
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(data)

  applyCommonStyles(worksheet, data, [18, 42, 30], 2)

  return worksheet
}

function createAuditSheet() {
  const data: WorksheetData = [
    ['审核及闭环确认表', null, null, null],
    ['审核环节', '审核意见/状态', '签字/确认人', '日期'],
    [
      '车间主任审核',
      '□同意排产计划\n□需调整（调整意见：________）\n□驳回重排',
      '',
      '',
    ],
    ['生产部审核\n(可选)', '□同意\n□需调整（调整意见：________）', '', ''],
    [
      '进度管控及备注说明：\n1. 每日下班前更新订单进度，同步录入ERP系统。\n2. 若出现异常，需立即填写《设备异常申请单》并上报。\n3. 若预计延期，需提前24小时上报客户及生产部。\n4. 本计划表一式三份，车间、生产部、ERP系统各留存一份。',
      null,
      null,
      null,
    ],
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(data)

  applyCommonStyles(worksheet, data, [24, 48, 22, 18], 3)
  worksheet['!rows'] = [
    { hpx: 32 },
    { hpx: 26 },
    { hpx: 66 },
    { hpx: 52 },
    { hpx: 116 },
  ]
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
  ]

  return worksheet
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

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

export function exportProductionScheduledPlanToExcel(
  orders: ProductionSchedulingOrder[],
) {
  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(workbook, createBasicInfoSheet(orders), '基础信息')
  XLSX.utils.book_append_sheet(
    workbook,
    createDetailSheet(orders),
    '订单排产详情',
  )
  XLSX.utils.book_append_sheet(
    workbook,
    createResourceSheet(),
    '生产资源配置',
  )
  XLSX.utils.book_append_sheet(workbook, createAuditSheet(), '审核确认')

  const buffer = XLSX.write(workbook, {
    ...EXCEL_WRITE_OPTIONS,
    bookType: 'xlsx',
    type: 'array',
  }) as ArrayBuffer

  downloadExcel(
    buffer,
    `精加工车间订单排产计划表_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`,
  )
}
