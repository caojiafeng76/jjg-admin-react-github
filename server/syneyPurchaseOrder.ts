import type { SyneyPurchaseOrder, SyneyPurchaseOrderRow } from '../src/services/syneyDeliveryOrderContract'
import type { SyneyServerEnv } from './syneyScmClient'
import { PO_LINE_FIELDS } from './syneyDeliveryOrderLogic'
import { openScmSession, parseGridData, postScmForm, ScmUserError, warmUpScmPage } from './syneyScmClient'

const PO_LINE_PAGE = 'Supplier/POLinePerform.aspx'
const GRID_PAGE_SIZE = 100

interface PurchaseOrderPage {
  rows: Record<string, unknown>[]
  total: number
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function parsePurchaseOrderRow(row: Record<string, unknown>, id: number): SyneyPurchaseOrderRow {
  const soNo = readText(row.SONo)
  const partNo = readText(row.PartNo)
  const partName = readText(row.PartName)
  const unit = readText(row.CalculateUnit)
  const endDate = readText(row.EndDate).split('T')[0]
  const parsedDate = new Date(endDate)
  const rawQuantity = row.CalculateQty
  const quantity = typeof rawQuantity === 'number' || readText(rawQuantity) ? Number(rawQuantity) : Number.NaN

  if (!soNo || !partNo || !partName || !unit) {
    throw new ScmUserError('西尼采购单明细缺少生产编号、物料件号、名称或核算单位')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !Number.isFinite(+parsedDate)
    || !parsedDate.toISOString().startsWith(endDate)) {
    throw new ScmUserError(`生产编号 ${soNo} 的交货日期无效`)
  }
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 2_147_483_647) {
    throw new ScmUserError(`生产编号 ${soNo} 的物料 ${partNo} 核算数量无效`)
  }

  return {
    id,
    soNo,
    endDate,
    partNo,
    partName,
    spec: readText(row.Spec),
    paramSpec: readText(row.ParamSpec),
    quantity,
    unit,
    remark: readText(row.Remark),
    orderRemark: readText(row.Remarks),
  }
}

export async function fetchPurchaseOrderRows(
  poNo: string,
  readPage: (pageIndex: number) => Promise<PurchaseOrderPage>,
  pageSize = GRID_PAGE_SIZE,
): Promise<SyneyPurchaseOrder> {
  const rows: SyneyPurchaseOrderRow[] = []
  const seen = new Set<number>()
  let expectedTotal: number | undefined

  for (let pageIndex = 0; ; pageIndex++) {
    const page = await readPage(pageIndex)
    expectedTotal ??= page.total
    if (page.total !== expectedTotal || page.rows.length !== Math.min(pageSize, expectedTotal - seen.size)) {
      throw new ScmUserError('西尼采购单明细未取齐，请重新获取')
    }

    for (const row of page.rows) {
      const id = Number(row?.PKID)
      if (!Number.isSafeInteger(id) || id <= 0) {
        throw new ScmUserError('西尼采购单返回的物料行标识无效')
      }
      if (seen.has(id)) {
        throw new ScmUserError('西尼采购单分页明细重复，请重新获取')
      }
      seen.add(id)
      if (readText(row.PONo) === poNo) {
        rows.push(parsePurchaseOrderRow(row, id))
      }
    }

    if (seen.size === expectedTotal)
      break
  }

  if (rows.length === 0) {
    throw new ScmUserError('未找到该西尼采购单')
  }
  return { poNo, rows }
}

export async function fetchSyneyPurchaseOrderFromScm(env: SyneyServerEnv, { poNo }: { poNo: string }) {
  const cookie = await openScmSession(env)
  await warmUpScmPage(cookie, PO_LINE_PAGE)

  return fetchPurchaseOrderRows(poNo, async (pageIndex) => {
    const response = await postScmForm(cookie, PO_LINE_PAGE, 'method=BindGrid&Type=NPO', {
      BindFields: `,${PO_LINE_FIELDS.join(',')}`,
      SearchParams: `&QUERY_S_PONo=${poNo}`,
      pageIndex: String(pageIndex),
      pageSize: String(GRID_PAGE_SIZE),
      sortField: 'PKID',
      sortOrder: 'asc',
    }, '获取西尼采购单')

    if (!response.trim())
      return { total: 0, rows: [] }

    // MiniUI uses an unquoted total field after the data array.
    try {
      const rows = parseGridData<Record<string, unknown>>(response)
      const total = Number(/^\s*,\s*"?total"?\s*:\s*(\d+)\s*\}\s*$/.exec(response.slice(response.lastIndexOf(']') + 1))?.[1])
      if (!Number.isSafeInteger(total) || total < 0)
        throw new Error('缺少明细总数')
      return { total, rows }
    }
    catch {
      throw new ScmUserError('西尼采购单明细格式无法识别，请稍后重试')
    }
  })
}
