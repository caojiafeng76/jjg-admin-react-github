import type {
  SyneyDeliveryOrderRequestMap,
  SyneyDeliveryOrderResponseMap,
} from '../src/services/syneyDeliveryOrderContract'
import type {
  ScmDeliveryOrder,
  ScmPoLine,
  ScmSafePartDetail,
  ScmSafePartRow,
} from './syneyDeliveryOrderLogic'
import type { SyneyServerEnv } from './syneyScmClient'
import {
  buildMakeDeliveryOrderFields,
  buildSafePartDetailFormFields,
  DELIVERY_ORDER_FIELDS,
  fileNameFromPath,
  filterDeliveryOrdersForPo,
  isScmSuccess,
  parseAjaxMessage,
  parseContentDispositionFileName,
  parseExportFilePath,
  parseHiddenInputValue,
  parsePartNameOptions,
  pickNewDeliveryOrder,
  pickReusableDeliveryOrder,
  planSafePartDetails,
  PO_LINE_FIELDS,
  SAFE_PART_DETAIL_FIELDS,
  SAFE_PART_ROW_FIELDS,
  selectDeliverableLines,
  validateDeliveryLines,
} from './syneyDeliveryOrderLogic'
import {
  ajaxMethodQuery,
  bindScmGrid,
  fetchWithTimeout,
  openScmSession,
  postScmForm,
  sanitizeScmMessage,
  SCM_BASE_URL,
  SCM_BUSINESS_URL,
  scmPageUrl,
  ScmUserError,
  warmUpScmPage,
} from './syneyScmClient'

const PO_LINE_PAGE = 'Supplier/POLinePerform.aspx'
const DELIVERY_ORDER_LIST_PAGE = 'Supplier/DeliveryOrderList.aspx'
const SAFE_PART_LIST_PAGE = 'Supplier/SafePartList.aspx'
const SAFE_PART_EDIT_PAGE = 'Supplier/SafePartEdit.aspx'
const SAFE_PART_DETAIL_EDIT_PAGE = 'Supplier/SafePartDetailEdit.aspx'
const FILE_STREAM_DOWN_PAGE = 'FileStreamDown.aspx'
const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024
const DOWNLOAD_TIMEOUT_MS = 60000

/** SCM 返回的提示是中文时直接展示；否则（空、英文异常页）在前面加上中文的失败原因 */
function scmError(responseText: string, fallback: string) {
  const detail = sanitizeScmMessage(parseAjaxMessage(responseText) || responseText, 200)
  if (/\p{Script=Han}/u.test(detail))
    return new ScmUserError(detail)
  return new ScmUserError(detail ? `${fallback}：${detail}` : fallback)
}

/** PKID 不在表格列里、由 SCM 服务端附带：统一转成数字，缺失时明确报错，避免选错行 */
function requirePkid<T extends { PKID: number }>(rows: T[], label: string): T[] {
  return rows.map((row) => {
    const pkid = Number(row.PKID)
    if (!Number.isInteger(pkid) || pkid <= 0) {
      throw new ScmUserError(`${label}返回的数据缺少 PKID，无法继续`)
    }
    return { ...row, PKID: pkid }
  })
}

async function listDeliveryOrders(cookie: string, searchParams: string) {
  const label = '查询送货单列表'
  return requirePkid(
    await bindScmGrid<ScmDeliveryOrder>(
      cookie,
      DELIVERY_ORDER_LIST_PAGE,
      'method=BindGrid&Type=NPO',
      DELIVERY_ORDER_FIELDS,
      searchParams,
      { label },
    ),
    label,
  )
}

async function createDeliveryOrder(
  env: SyneyServerEnv,
  { poNo }: SyneyDeliveryOrderRequestMap['create'],
): Promise<SyneyDeliveryOrderResponseMap['create']> {
  const cookie = await openScmSession(env)
  await warmUpScmPage(cookie, PO_LINE_PAGE)

  const lines = requirePkid(
    await bindScmGrid<ScmPoLine>(
      cookie,
      PO_LINE_PAGE,
      'method=BindGrid&Type=NPO',
      PO_LINE_FIELDS,
      `&QUERY_S_PONo=${poNo}`,
      { label: '查询采购订单履行明细' },
    ),
    '查询采购订单履行明细',
  )
  const deliverableLines = selectDeliverableLines(lines, poNo)

  await warmUpScmPage(cookie, DELIVERY_ORDER_LIST_PAGE)
  const ordersBefore = filterDeliveryOrdersForPo(
    await listDeliveryOrders(cookie, `&QUERY_S_PONos=${poNo}`),
    poNo,
  )

  if (deliverableLines.length === 0) {
    const reusable = pickReusableDeliveryOrder(ordersBefore, poNo)
    if (reusable?.No) {
      return {
        deliveryOrderId: reusable.PKID,
        deliveryNo: reusable.No,
        lineCount: 0,
        reused: true,
      }
    }

    throw new ScmUserError(
      lines.length === 0
        ? `SCM 中找不到订单 ${poNo}`
        : `SCM 中订单 ${poNo} 没有可送货的明细（可能已生成送货单）`,
    )
  }

  const validationError = validateDeliveryLines(deliverableLines)
  if (validationError) {
    throw new ScmUserError(validationError)
  }

  const responseText = await postScmForm(
    cookie,
    PO_LINE_PAGE,
    ajaxMethodQuery('MakeDeliveryOrder'),
    buildMakeDeliveryOrderFields(deliverableLines),
    '生成送货单',
  )

  // 不依赖返回文案：以送货单列表里多出的新单为准
  const ordersAfter = await listDeliveryOrders(cookie, `&QUERY_S_PONos=${poNo}`)
  const created = pickNewDeliveryOrder(ordersBefore, ordersAfter, poNo)
  if (!created?.No) {
    throw scmError(
      responseText,
      'SCM 未生成送货单，请到 SCM 送货单列表核对',
    )
  }

  return {
    deliveryOrderId: created.PKID,
    deliveryNo: created.No,
    lineCount: deliverableLines.length,
    reused: false,
  }
}

async function fetchPartNameOptions(cookie: string, SONo: string) {
  try {
    const response = await fetchWithTimeout(
      `${SCM_BUSINESS_URL}/Handler/ComboBox.ashx?method=GetPartNameType&SONO=${encodeURIComponent(SONo)}`,
      {
        method: 'POST',
        headers: {
          'Cookie': cookie,
          'Origin': SCM_BASE_URL,
          'Referer': scmPageUrl(SAFE_PART_DETAIL_EDIT_PAGE),
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
      '西尼 SCM 产品名称选项获取超时',
    )
    return response.ok ? parsePartNameOptions(await response.text()) : []
  }
  catch {
    return []
  }
}

async function planSafeParts(
  env: SyneyServerEnv,
  { deliveryNo, parts }: SyneyDeliveryOrderRequestMap['planSafeParts'],
): Promise<SyneyDeliveryOrderResponseMap['planSafeParts']> {
  const cookie = await openScmSession(env)
  await warmUpScmPage(cookie, SAFE_PART_LIST_PAGE)

  const rows = requirePkid(
    (
      await bindScmGrid<ScmSafePartRow>(
        cookie,
        SAFE_PART_LIST_PAGE,
        'method=BindGrid&Type=NO',
        SAFE_PART_ROW_FIELDS,
        `&QUERY_S_No=${deliveryNo}`,
        { label: '查询安全部件列表' },
      )
    ).filter(row => String(row.No ?? '').trim() === deliveryNo),
    '查询安全部件列表',
  )

  if (rows.length === 0) {
    return {
      items: [],
      skipped: 0,
      rowCount: 0,
      warnings: parts.length > 0 ? ['SCM 送货单中没有安全部件行，已跳过填写'] : [],
    }
  }

  await warmUpScmPage(cookie, SAFE_PART_EDIT_PAGE)
  const existingDetailsByRowId = new Map<number, ScmSafePartDetail[]>()
  for (const row of rows) {
    existingDetailsByRowId.set(
      row.PKID,
      await bindScmGrid<ScmSafePartDetail>(
        cookie,
        SAFE_PART_EDIT_PAGE,
        'method=BindGrid',
        SAFE_PART_DETAIL_FIELDS,
        `&QUERY_I_SaftPartID=${row.PKID}`,
        { label: '查询安全部件明细', pageSize: 200, sortOrder: 'asc' },
      ),
    )
  }

  await warmUpScmPage(cookie, SAFE_PART_DETAIL_EDIT_PAGE)
  const partNameOptionsBySONo = new Map<string, string[]>()
  for (const SONo of new Set(rows.map(row => String(row.SONo ?? '').trim()))) {
    if (SONo) {
      partNameOptionsBySONo.set(SONo, await fetchPartNameOptions(cookie, SONo))
    }
  }

  const plan = planSafePartDetails({
    rows,
    parts,
    existingDetailsByRowId,
    partNameOptionsBySONo,
  })

  if (plan.problems.length > 0) {
    throw new ScmUserError(`安全部件信息无法自动填写：${plan.problems.join('；')}`)
  }

  return {
    items: plan.items,
    skipped: plan.skipped,
    rowCount: rows.length,
    warnings: plan.warnings,
  }
}

async function addSafePartDetail(
  env: SyneyServerEnv,
  { item }: SyneyDeliveryOrderRequestMap['addSafePartDetail'],
): Promise<SyneyDeliveryOrderResponseMap['addSafePartDetail']> {
  const cookie = await openScmSession(env)

  // 重试时避免重复添加：提交前再查一次该行已有明细
  await warmUpScmPage(cookie, SAFE_PART_EDIT_PAGE)
  const existing = await bindScmGrid<ScmSafePartDetail>(
    cookie,
    SAFE_PART_EDIT_PAGE,
    'method=BindGrid',
    SAFE_PART_DETAIL_FIELDS,
    `&QUERY_I_SaftPartID=${item.SaftPartID}`,
    { label: '查询安全部件明细', pageSize: 200, sortOrder: 'asc' },
  )
  if (existing.some(detail => String(detail.SafePartNo ?? '').trim() === item.SafePartNo)) {
    return { skipped: true, message: '已存在相同编号的明细' }
  }

  const pageHtml = await warmUpScmPage(cookie, SAFE_PART_DETAIL_EDIT_PAGE)
  const booker = {
    id: parseHiddenInputValue(pageHtml, '__CURRENT_USERID__'),
    name: parseHiddenInputValue(pageHtml, '__CURRENT_USERNAME__'),
  }

  const responseText = await postScmForm(
    cookie,
    SAFE_PART_DETAIL_EDIT_PAGE,
    ajaxMethodQuery('FormSave', '保存表单数据'),
    buildSafePartDetailFormFields(item, booker),
    '保存安全部件明细',
  )

  if (!isScmSuccess(responseText)) {
    throw scmError(responseText, '保存安全部件明细失败')
  }

  return { skipped: false, message: parseAjaxMessage(responseText) }
}

async function confirmDeliveryOrder(
  env: SyneyServerEnv,
  { deliveryOrderId, deliveryNo }: SyneyDeliveryOrderRequestMap['confirm'],
): Promise<SyneyDeliveryOrderResponseMap['confirm']> {
  const cookie = await openScmSession(env)
  await warmUpScmPage(cookie, DELIVERY_ORDER_LIST_PAGE)

  const order = (await listDeliveryOrders(cookie, `&QUERY_S_No=${deliveryNo}`)).find(
    candidate => candidate.PKID === deliveryOrderId,
  )
  if (!order) {
    throw new ScmUserError(`SCM 中找不到送货单 ${deliveryNo}`)
  }
  if (Number(order.DeliveryStatus) > 0) {
    return { alreadyConfirmed: true, message: '送货单已确认' }
  }

  const responseText = await postScmForm(
    cookie,
    DELIVERY_ORDER_LIST_PAGE,
    ajaxMethodQuery('SupplierConfirm'),
    { PKIDS: String(deliveryOrderId) },
    '供应商确认',
  )
  if (!isScmSuccess(responseText)) {
    throw scmError(responseText, '供应商确认失败')
  }

  return { alreadyConfirmed: false, message: parseAjaxMessage(responseText) }
}

async function printDeliveryOrders(
  env: SyneyServerEnv,
  { deliveryOrderIds, deliveryNos }: SyneyDeliveryOrderRequestMap['print'],
): Promise<SyneyDeliveryOrderResponseMap['print']> {
  const cookie = await openScmSession(env)
  await warmUpScmPage(cookie, DELIVERY_ORDER_LIST_PAGE)

  const responseText = await postScmForm(
    cookie,
    DELIVERY_ORDER_LIST_PAGE,
    ajaxMethodQuery('PrintDeliveryOrder'),
    {
      POID: String(deliveryOrderIds[0]),
      PONOs: deliveryNos.join(','),
      PKIDs: deliveryOrderIds.join(','),
    },
    '导出送货单',
  )

  const filePath = parseExportFilePath(responseText)
  if (!filePath) {
    throw scmError(responseText, '导出送货单失败')
  }

  await warmUpScmPage(cookie, FILE_STREAM_DOWN_PAGE)
  const fallbackName = fileNameFromPath(filePath) || '送货单.xls'
  const downloadResponse = await fetchWithTimeout(
    `${SCM_BUSINESS_URL}/Handler/FileDownLoad.ashx?FileName=${encodeURIComponent(fallbackName)}&FilePath=${encodeURIComponent(filePath)}`,
    {
      headers: {
        Cookie: cookie,
        Referer: scmPageUrl(FILE_STREAM_DOWN_PAGE),
      },
    },
    '西尼 SCM 下载送货单超时',
    DOWNLOAD_TIMEOUT_MS,
  )
  if (!downloadResponse.ok) {
    throw new ScmUserError(`下载送货单失败（${downloadResponse.status}）`)
  }

  const declaredLength = Number(downloadResponse.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_DOWNLOAD_BYTES) {
    throw new ScmUserError('送货单文件过大，请到 SCM 手动下载')
  }

  const buffer = Buffer.from(await downloadResponse.arrayBuffer())
  if (buffer.byteLength === 0) {
    throw new ScmUserError('下载的送货单文件为空，请到 SCM 手动下载')
  }
  if (buffer.byteLength > MAX_DOWNLOAD_BYTES) {
    throw new ScmUserError('送货单文件过大，请到 SCM 手动下载')
  }

  const contentType = downloadResponse.headers.get('content-type') || 'application/octet-stream'
  if (contentType.includes('text/html')) {
    throw new ScmUserError(
      sanitizeScmMessage(buffer.toString('utf8')) || '下载送货单失败，SCM 返回了网页而不是文件',
    )
  }

  return {
    fileName:
      parseContentDispositionFileName(downloadResponse.headers.get('content-disposition'))
      || fallbackName,
    contentType,
    base64: buffer.toString('base64'),
  }
}

type DeliveryOrderHandlers = {
  [A in keyof SyneyDeliveryOrderRequestMap]: (
    env: SyneyServerEnv,
    payload: SyneyDeliveryOrderRequestMap[A],
  ) => Promise<SyneyDeliveryOrderResponseMap[A]>
}

export const syneyDeliveryOrderHandlers: DeliveryOrderHandlers = {
  create: createDeliveryOrder,
  planSafeParts,
  addSafePartDetail,
  confirm: confirmDeliveryOrder,
  print: printDeliveryOrders,
}

export async function runSyneyDeliveryOrderAction<A extends keyof SyneyDeliveryOrderRequestMap>(
  env: SyneyServerEnv,
  action: A,
  payload: SyneyDeliveryOrderRequestMap[A],
): Promise<SyneyDeliveryOrderResponseMap[A]> {
  const handler = syneyDeliveryOrderHandlers[action] as DeliveryOrderHandlers[A]
  return handler(env, payload)
}
