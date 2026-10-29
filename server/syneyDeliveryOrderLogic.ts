/**
 * 西尼 SCM「生成送货单」的纯逻辑：字段组装、前置校验、安全部件匹配、响应解析。
 * 不发网络请求，便于单测；网络流程见 syneyDeliveryOrderServer.ts。
 */
import type {
  SyneyDeliveryOrderAction,
  SyneyDeliveryOrderRequestMap,
  SyneySafePartDetailPlanItem,
  SyneySafePartSourceRow,
} from '../src/services/syneyDeliveryOrderContract'
import {
  MAX_PRINT_DELIVERY_ORDERS,
  MAX_SAFE_PART_CHECK_PO_NOS,
  MAX_SAFE_PART_SOURCE_ROWS,
  SYNEY_DELIVERY_ORDER_ACTIONS,
} from '../src/services/syneyDeliveryOrderContract'

/** 采购订单履行（POLinePerform）明细行 */
export interface ScmPoLine {
  PKID: number
  PONo: string | null
  EndDate: string | null
  SupplierCode: string | null
  SupplierName: string | null
  NPOType: number | null
  PROType: number | null
  Remarks: string | null
  WeightType: number | null
  PartStatus: number | null
  QuoteStatus?: number | null
  PartNo: string | null
  SONo: string | null
  /** SCM 返回 JSON 布尔值，兼容字符串 / 数字写法 */
  IsSafePart?: boolean | string | number | null
}

/** 送货单列表（DeliveryOrderList）行 */
export interface ScmDeliveryOrder {
  PKID: number
  No: string | null
  PONos: string | null
  DeliveryStatus: number | null
}

/** 安全部件列表（SafePartList）行：送货单中的一个安全部件物料 */
export interface ScmSafePartRow {
  PKID: number
  No: string | null
  SONo: string | null
  PONo: string | null
  PartNo: string | null
  SupplierCode: string | null
  SupplierName: string | null
}

/** 安全部件明细（SafePartEdit 下方明细表） */
export interface ScmSafePartDetail {
  SafePartNo: string | null
  SafePartModel?: string | null
  PartNameType?: string | null
}

/*
 * BindFields 与 SCM 页面表格列完全一致（页面 `GetGridFields` 的结果，顺序相同），
 * 已在浏览器中抓包核对。PKID、QuoteStatus 等不在表格列里的字段 SCM 服务端会自动带出。
 */

/** POLinePerform.aspx 表格列 */
export const PO_LINE_FIELDS = [
  'IsBsDetail',
  'PartStatus',
  'NPOType',
  'PROType',
  'PONo',
  'EndDate',
  'Goodsto',
  'SupplierCode',
  'SupplierName',
  'PartNo',
  'PartName',
  'Spec',
  'ParamSpec',
  'CalculateQty',
  'CalculateUnit',
  'Qty',
  'Unit',
  'AllreadyDeliveryQty',
  'AllInwarehouseQty',
  'ReturnQty',
  'Purtype',
  'SONo',
  'WeightType',
  'Remarks',
  'Remark',
  'SortNo',
  'IsSafePart',
] as const

/** DeliveryOrderList.aspx 表格列 */
export const DELIVERY_ORDER_FIELDS = [
  'DeliveryStatus',
  'DeliveryType',
  'SupplierName',
  'SupplierCode',
  'No',
  'DeliveryDate',
  'PONos',
  'SupplierPrintDate',
  'UsedNo',
  'CreateStaffName',
  'ConfirmStaffName',
  'ConfirmDate',
  'CheckStatus',
  'LockStatus',
  'WeightType',
] as const

/** SafePartList.aspx 表格列 */
export const SAFE_PART_ROW_FIELDS = [
  'DeliveryStatus',
  'DeliveryType',
  'SONo',
  'SupplierCode',
  'SupplierName',
  'No',
  'DeliveryDate',
  'PONo',
  'Ext1',
  'ext2',
  'PartNo',
  'PartName',
  'Spec',
  'ParamSpec',
  'Qty',
  'Unit',
  'Remark',
] as const

export const SAFE_PART_DETAIL_FIELDS = [
  'SafePartNo',
  'SafePartModel',
  'SafePartFCDate',
  'PartNameType',
  'Remark',
] as const

/** SCM 物料状态：0 已创建、5 部分送货，其余（全部送货/入库/作废/暂停/关闭）不能再生成送货单 */
const DELIVERABLE_PART_STATUSES = new Set([0, 5])
/** 价格有效的报价状态（与 SCM 页面 MakeDeliveryOrder 校验一致） */
const VALID_QUOTE_STATUSES = new Set([0, 20])
const RAW_MATERIAL_PRO_TYPE = 10
/** SCM 要求上传附件的产品名称，自动化无法处理 */
const ATTACHMENT_REQUIRED_PART_NAMES = new Set(['安全钳', '限速器'])

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function normalizeKeyPart(value: unknown) {
  return text(value).replace(/\s+/g, '').toUpperCase()
}

export function safePartKey(SONo: unknown, PartNo: unknown) {
  return `${normalizeKeyPart(SONo)}|${normalizeKeyPart(PartNo)}`
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/**
 * 把 SCM 返回的日期统一成 MiniUI `mini.encode` 的格式 `yyyy-MM-ddTHH:mm:ss`。
 * 兼容 `2026-10-28T00:00:00`、`2026-10-28 00:00:00`、`2026/10/28`、`/Date(1793170000000)/`。
 */
export function normalizeScmDateTime(value: unknown): string {
  const raw = text(value)
  if (!raw)
    return ''

  const msDate = raw.match(/^\/Date\((-?\d+)(?:[+-]\d+)?\)\/$/)
  if (msDate) {
    const date = new Date(Number(msDate[1]))
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const match = raw.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
  )
  if (!match)
    return raw

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match
  return `${year}-${pad(Number(month))}-${pad(Number(day))}T${pad(Number(hour))}:${pad(Number(minute))}:${pad(Number(second))}`
}

function datePart(value: unknown) {
  return normalizeScmDateTime(value).slice(0, 10)
}

/** jQuery 1.6.2 `$.param` 序列化语义：null → "null"、undefined → "undefined" */
export function toAjaxValue(value: unknown) {
  return String(value)
}

export function isScmSuccess(responseText: string) {
  return responseText.includes('成功')
}

/** SCM 页面回调统一取 `text.split(',')[0]` 作为提示 */
export function parseAjaxMessage(responseText: string) {
  return responseText.split(',')[0]?.trim() ?? ''
}

/** PrintDeliveryOrder 成功时返回 `导出成功,<文件路径>` */
export function parseExportFilePath(responseText: string): string | null {
  const [message, ...rest] = responseText.split(',')
  if (message?.trim() !== '导出成功')
    return null

  const path = rest.join(',').trim()
  return path || null
}

export function splitPoNos(value: unknown) {
  return text(value)
    .split(/[,;，；\s]+/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function selectDeliverableLines(lines: ScmPoLine[], poNo: string) {
  return lines.filter(
    line =>
      text(line.PONo) === poNo
      && DELIVERABLE_PART_STATUSES.has(Number(line.PartStatus)),
  )
}

export function isScmTrue(value: unknown) {
  if (typeof value === 'boolean')
    return value
  const raw = text(value).toLowerCase()
  return raw === 'true' || raw === '1'
}

/** 明细中任意一条 IsSafePart 为 true；全部为 false 时该订单无需填写 / 导出安全部件 */
export function hasSafePartLines(lines: ScmPoLine[], poNo?: string) {
  return lines.some(
    line => (poNo === undefined || text(line.PONo) === poNo) && isScmTrue(line.IsSafePart),
  )
}

/**
 * 复刻 SCM 页面 `MakeDeliveryOrder` 在浏览器端的校验，失败时返回中文原因。
 */
export function validateDeliveryLines(lines: ScmPoLine[]): string | null {
  if (lines.length === 0)
    return '没有可生成送货单的明细'

  const [first] = lines

  if (lines.some(line => text(line.SupplierCode) !== text(first.SupplierCode)))
    return '不同供应商的物料不能生成一张送货单'

  if (lines.some(line => datePart(line.EndDate) !== datePart(first.EndDate)))
    return '不是同一交货期的物料不能生成一张送货单'

  if (lines.some(line => line.NPOType !== first.NPOType))
    return '不同订单类型的物料不能生成一张送货单'

  const invalidPricePoNos = Array.from(
    new Set(
      lines
        // QuoteStatus 由 SCM 服务端附带；万一没带回来不在这里拦截，交给 SCM 自己校验
        .filter(
          line =>
            line.QuoteStatus !== null
            && line.QuoteStatus !== undefined
            && !VALID_QUOTE_STATUSES.has(Number(line.QuoteStatus)),
        )
        .map(line => text(line.PONo)),
    ),
  )
  if (invalidPricePoNos.length > 0)
    return `没有有效价格的订单不能生成送货单：${invalidPricePoNos.join('、')}`

  if (lines.some(line => text(line.Remarks) !== text(first.Remarks)))
    return '备注不同的订单不能生成一张送货单'

  if (lines.some(line => line.PROType === RAW_MATERIAL_PRO_TYPE)) {
    if (lines.some(line => line.PROType !== RAW_MATERIAL_PRO_TYPE))
      return '所有订单必须都是原材料订单才能生成同一个送货单'
    if (lines.some(line => line.WeightType !== first.WeightType))
      return '不是同一种称重类型的原材料物料不能生成一张送货单'
  }

  return null
}

/** `ServerArgs.AjaxData`：取第一条明细的表头信息 + 选中明细 PKID */
export function buildMakeDeliveryOrderFields(lines: ScmPoLine[]) {
  const [first] = lines
  return {
    WeightType: toAjaxValue(first.WeightType),
    EndDate: normalizeScmDateTime(first.EndDate),
    SupplierCode: toAjaxValue(first.SupplierCode),
    SupplierName: toAjaxValue(first.SupplierName),
    NPOType: toAjaxValue(first.NPOType),
    Remarks: toAjaxValue(first.Remarks),
    params: `&QUERY_N_PKID=(${lines.map(line => line.PKID).join(',')})`,
  }
}

export function filterDeliveryOrdersForPo(orders: ScmDeliveryOrder[], poNo: string) {
  return orders.filter(order => splitPoNos(order.PONos).includes(poNo))
}

/** 新生成的送货单：生成前不存在、包含该订单号、状态为已创建，取 PKID 最大的一张 */
export function pickNewDeliveryOrder(
  before: ScmDeliveryOrder[],
  after: ScmDeliveryOrder[],
  poNo: string,
) {
  const existingIds = new Set(before.map(order => order.PKID))
  return filterDeliveryOrdersForPo(after, poNo)
    .filter(order => !existingIds.has(order.PKID) && Number(order.DeliveryStatus) === 0)
    .sort((a, b) => b.PKID - a.PKID)[0] ?? null
}

export function pickReusableDeliveryOrder(orders: ScmDeliveryOrder[], poNo: string) {
  return filterDeliveryOrdersForPo(orders, poNo)
    .filter(order => Number(order.DeliveryStatus) === 0)
    .sort((a, b) => b.PKID - a.PKID)[0] ?? null
}

export interface PlanSafePartDetailsInput {
  rows: ScmSafePartRow[]
  parts: SyneySafePartSourceRow[]
  /** key: SCM 安全部件行 PKID */
  existingDetailsByRowId: Map<number, ScmSafePartDetail[]>
  /** key: 生产号；值为空数组表示未取到下拉选项，不做名称校验 */
  partNameOptionsBySONo: Map<string, string[]>
}

export interface PlanSafePartDetailsResult {
  items: SyneySafePartDetailPlanItem[]
  skipped: number
  problems: string[]
  warnings: string[]
}

function describeKey(SONo: unknown, PartNo: unknown) {
  return `生产号 ${text(SONo) || '-'} 件号 ${text(PartNo) || '-'}`
}

/**
 * 把本系统的安全部件信息分配到 SCM 安全部件行：
 * - 同一「生产号+件号」在 SCM 只有 1 行：该键下所有信息都作为这一行的明细；
 * - 在 SCM 有 n 行且本系统也正好 n 条：按顺序一对一；
 * - 其他情况记为 problem，整张送货单不提交。
 */
export function planSafePartDetails({
  rows,
  parts,
  existingDetailsByRowId,
  partNameOptionsBySONo,
}: PlanSafePartDetailsInput): PlanSafePartDetailsResult {
  const problems: string[] = []
  const warnings: string[] = []
  const items: SyneySafePartDetailPlanItem[] = []
  let skipped = 0

  const partsByKey = new Map<string, SyneySafePartSourceRow[]>()
  parts.forEach((part) => {
    const key = safePartKey(part.SONo, part.PartNo)
    partsByKey.set(key, [...(partsByKey.get(key) ?? []), part])
  })

  const rowsByKey = new Map<string, ScmSafePartRow[]>()
  rows.forEach((row) => {
    const key = safePartKey(row.SONo, row.PartNo)
    rowsByKey.set(key, [...(rowsByKey.get(key) ?? []), row])
  })

  const assignments: Array<{ row: ScmSafePartRow, part: SyneySafePartSourceRow }> = []

  rowsByKey.forEach((keyRows, key) => {
    const keyParts = partsByKey.get(key) ?? []
    const [sample] = keyRows

    if (keyParts.length === 0) {
      problems.push(`${describeKey(sample.SONo, sample.PartNo)}：本系统没有对应的安全部件信息`)
      return
    }

    if (keyRows.length === 1) {
      keyParts.forEach(part => assignments.push({ row: sample, part }))
      return
    }

    if (keyRows.length !== keyParts.length) {
      problems.push(
        `${describeKey(sample.SONo, sample.PartNo)}：SCM 有 ${keyRows.length} 行，本系统有 ${keyParts.length} 条，无法一一对应`,
      )
      return
    }

    const sortedRows = [...keyRows].sort((a, b) => a.PKID - b.PKID)
    sortedRows.forEach((row, index) => assignments.push({ row, part: keyParts[index] }))
  })

  partsByKey.forEach((keyParts, key) => {
    if (!rowsByKey.has(key)) {
      warnings.push(`${describeKey(keyParts[0].SONo, keyParts[0].PartNo)}：SCM 送货单中没有该安全部件行，已忽略`)
    }
  })

  const plannedNosByRowId = new Map<number, Set<string>>()

  assignments.forEach(({ row, part }) => {
    const label = describeKey(row.SONo, row.PartNo)
    const partCode = text(part.partCode)
    const partModel = text(part.partModel)
    const partName = text(part.partName)
    const date = text(part.date).slice(0, 10)

    if (!partCode || !partModel || !partName) {
      problems.push(`${label}：编号、型号或名称为空`)
      return
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      problems.push(`${label}：制造日期（订单交货日期）为空或格式不正确`)
      return
    }

    if (ATTACHMENT_REQUIRED_PART_NAMES.has(partName)) {
      problems.push(`${label}：产品名称为「${partName}」，SCM 要求上传附件，请手动填写`)
      return
    }

    const options = partNameOptionsBySONo.get(text(row.SONo)) ?? []
    if (options.length > 0 && !options.includes(partName)) {
      problems.push(`${label}：产品名称「${partName}」不在 SCM 可选项中（可选：${options.join('、')}）`)
      return
    }

    const existingNos = new Set(
      (existingDetailsByRowId.get(row.PKID) ?? []).map(detail => text(detail.SafePartNo)),
    )
    const plannedNos = plannedNosByRowId.get(row.PKID) ?? new Set<string>()
    plannedNosByRowId.set(row.PKID, plannedNos)

    if (existingNos.has(partCode) || plannedNos.has(partCode)) {
      skipped++
      return
    }

    plannedNos.add(partCode)
    items.push({
      SaftPartID: row.PKID,
      SupplierCode: text(row.SupplierCode),
      SupplierName: text(row.SupplierName),
      SONo: text(row.SONo),
      PartNo: text(row.PartNo),
      SafePartNo: partCode,
      SafePartModel: partModel,
      PartNameType: partName,
      SafePartFCDate: date,
    })
  })

  return { items, skipped, problems, warnings }
}

export interface ScmBooker {
  id: string
  name: string
}

/**
 * SafePartDetailEdit 的 `FormSave` 请求体：`PKID=-1` 表示新增，
 * `data` 为 `mini.encode([formData])`，日期按 MiniUI 编码为 `yyyy-MM-ddT00:00:00`。
 */
export function buildSafePartDetailFormFields(
  item: SyneySafePartDetailPlanItem,
  booker: ScmBooker,
) {
  const formData = {
    SupplierCode: item.SupplierCode,
    SupplierName: item.SupplierName,
    SONo: item.SONo,
    SafePartFCDate: `${item.SafePartFCDate}T00:00:00`,
    SaftPartID: String(item.SaftPartID),
    SafePartNo: item.SafePartNo,
    SafePartModel: item.SafePartModel,
    PartNameType: item.PartNameType,
    MadeUnit: '',
    AttachFileName: '',
    Accessory: '',
    Remark: '',
    PKID: '-1',
    BOOKERID: booker.id,
    BOOKERNAME: booker.name,
  }

  return {
    PKID: '-1',
    data: JSON.stringify([formData]),
  }
}

/** 从 ASP.NET 页面 HTML 里读取 `<input type="hidden" id="..." value="...">` */
export function parseHiddenInputValue(html: string, id: string) {
  const inputPattern = new RegExp(`<input[^>]*\\bid="${id}"[^>]*>`, 'i')
  const input = html.match(inputPattern)?.[0]
  const value = input?.match(/\bvalue="([^"]*)"/i)?.[1] ?? ''
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** 解析 `Handler/ComboBox.ashx?method=GetPartNameType` 返回的 `[{ KeyCnValue }]` */
export function parsePartNameOptions(responseText: string): string[] {
  const trimmed = responseText.trim()
  const arrayStart = trimmed.indexOf('[')
  const arrayEnd = trimmed.lastIndexOf(']')
  if (arrayStart === -1 || arrayEnd <= arrayStart)
    return []

  try {
    const parsed = JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1)) as unknown
    if (!Array.isArray(parsed))
      return []
    return Array.from(
      new Set(
        parsed
          .map(option =>
            option && typeof option === 'object'
              ? text((option as Record<string, unknown>).KeyCnValue)
              : '',
          )
          .filter(Boolean),
      ),
    )
  }
  catch {
    return []
  }
}

/** `Content-Disposition` 中的文件名（兼容 filename*= 与 URL 编码中文） */
export function parseContentDispositionFileName(header: string | null) {
  if (!header)
    return null

  const encoded = header.match(/filename\*=(?:UTF-8'')?([^;]+)/i)?.[1]
  const plain = header.match(/filename="?([^";]+)"?/i)?.[1]
  const value = (encoded ?? plain)?.trim()
  if (!value)
    return null

  try {
    return decodeURIComponent(value)
  }
  catch {
    return value
  }
}

export function fileNameFromPath(path: string) {
  const name = path.split(/[\\/]/).pop() ?? ''
  try {
    return decodeURIComponent(name)
  }
  catch {
    return name
  }
}

// ---------------------------------------------------------------------------
// 请求体校验
// ---------------------------------------------------------------------------

const MAX_TEXT_LENGTH = 128

function parseIdentifier(value: unknown) {
  if (typeof value !== 'string')
    return null
  const identifier = value.trim()
  // 单号会拼进 SCM 的 SearchParams，只允许常见单号字符，避免拼接出额外查询条件
  return /^[\w\-./]{1,64}$/.test(identifier) ? identifier : null
}

function parseShortText(value: unknown, { allowEmpty = false } = {}) {
  if (typeof value !== 'string')
    return null
  const result = value.trim()
  if (result.length > MAX_TEXT_LENGTH)
    return null
  if (!allowEmpty && !result)
    return null
  return result
}

function parsePositiveInt(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

function parseIsoDate(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export type ParsedDeliveryOrderRequest
  = | {
    [A in SyneyDeliveryOrderAction]: {
      ok: true
      action: A
      payload: SyneyDeliveryOrderRequestMap[A]
    }
  }[SyneyDeliveryOrderAction]
  | { ok: false, error: string }

function parseSourceRow(value: unknown): SyneySafePartSourceRow | null {
  if (!isRecord(value))
    return null
  const SONo = parseShortText(value.SONo)
  const PartNo = parseShortText(value.PartNo)
  const partCode = parseShortText(value.partCode, { allowEmpty: true })
  const partModel = parseShortText(value.partModel, { allowEmpty: true })
  const partName = parseShortText(value.partName, { allowEmpty: true })
  const date = parseShortText(value.date, { allowEmpty: true })
  if (
    SONo === null
    || PartNo === null
    || partCode === null
    || partModel === null
    || partName === null
    || date === null
  ) {
    return null
  }
  return { SONo, PartNo, partCode, partModel, partName, date }
}

function parsePlanItem(value: unknown): SyneySafePartDetailPlanItem | null {
  if (!isRecord(value))
    return null
  const SaftPartID = parsePositiveInt(value.SaftPartID)
  const SupplierCode = parseShortText(value.SupplierCode, { allowEmpty: true })
  const SupplierName = parseShortText(value.SupplierName, { allowEmpty: true })
  const SONo = parseShortText(value.SONo)
  const PartNo = parseShortText(value.PartNo)
  const SafePartNo = parseShortText(value.SafePartNo)
  const SafePartModel = parseShortText(value.SafePartModel)
  const PartNameType = parseShortText(value.PartNameType)
  const SafePartFCDate = parseIsoDate(value.SafePartFCDate)
  if (
    SaftPartID === null
    || SupplierCode === null
    || SupplierName === null
    || SONo === null
    || PartNo === null
    || SafePartNo === null
    || SafePartModel === null
    || PartNameType === null
    || SafePartFCDate === null
  ) {
    return null
  }
  return {
    SaftPartID,
    SupplierCode,
    SupplierName,
    SONo,
    PartNo,
    SafePartNo,
    SafePartModel,
    PartNameType,
    SafePartFCDate,
  }
}

export function parseDeliveryOrderRequest(body: Record<string, unknown>): ParsedDeliveryOrderRequest {
  const action = body.action
  if (
    typeof action !== 'string'
    || !(SYNEY_DELIVERY_ORDER_ACTIONS as readonly string[]).includes(action)
  ) {
    return { ok: false, error: '不支持的操作' }
  }

  const payload = isRecord(body.payload) ? body.payload : {}

  switch (action as SyneyDeliveryOrderAction) {
    case 'create': {
      const poNo = parseIdentifier(payload.poNo)
      return poNo
        ? { ok: true, action: 'create', payload: { poNo } }
        : { ok: false, error: '订单号长度必须为 1 到 64 个字符' }
    }
    case 'planSafeParts': {
      const deliveryNo = parseIdentifier(payload.deliveryNo)
      if (!deliveryNo)
        return { ok: false, error: '送货单号长度必须为 1 到 64 个字符' }
      if (!Array.isArray(payload.parts) || payload.parts.length > MAX_SAFE_PART_SOURCE_ROWS)
        return { ok: false, error: '安全部件信息格式不正确' }
      const parts = payload.parts.map(parseSourceRow)
      if (parts.includes(null))
        return { ok: false, error: '安全部件信息格式不正确' }
      return {
        ok: true,
        action: 'planSafeParts',
        payload: { deliveryNo, parts: parts as SyneySafePartSourceRow[] },
      }
    }
    case 'addSafePartDetail': {
      const item = parsePlanItem(payload.item)
      return item
        ? { ok: true, action: 'addSafePartDetail', payload: { item } }
        : { ok: false, error: '安全部件明细格式不正确' }
    }
    case 'confirm': {
      const deliveryOrderId = parsePositiveInt(payload.deliveryOrderId)
      const deliveryNo = parseIdentifier(payload.deliveryNo)
      return deliveryOrderId && deliveryNo
        ? { ok: true, action: 'confirm', payload: { deliveryOrderId, deliveryNo } }
        : { ok: false, error: '送货单参数不正确' }
    }
    case 'print': {
      const ids = Array.isArray(payload.deliveryOrderIds)
        ? payload.deliveryOrderIds.map(parsePositiveInt)
        : []
      const nos = Array.isArray(payload.deliveryNos)
        ? payload.deliveryNos.map(parseIdentifier)
        : []
      if (
        ids.length === 0
        || ids.length > MAX_PRINT_DELIVERY_ORDERS
        || ids.length !== nos.length
        || ids.includes(null)
        || nos.includes(null)
      ) {
        return { ok: false, error: '送货单参数不正确' }
      }
      return {
        ok: true,
        action: 'print',
        payload: {
          deliveryOrderIds: ids as number[],
          deliveryNos: nos as string[],
        },
      }
    }
    case 'checkSafeParts': {
      const poNos = Array.isArray(payload.poNos) ? payload.poNos.map(parseIdentifier) : []
      if (
        poNos.length === 0
        || poNos.length > MAX_SAFE_PART_CHECK_PO_NOS
        || poNos.includes(null)
      ) {
        return { ok: false, error: `订单号参数不正确（1 到 ${MAX_SAFE_PART_CHECK_PO_NOS} 个）` }
      }
      return {
        ok: true,
        action: 'checkSafeParts',
        payload: { poNos: Array.from(new Set(poNos as string[])) },
      }
    }
  }
}
