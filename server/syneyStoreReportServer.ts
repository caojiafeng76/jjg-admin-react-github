import type { SyneyServerEnv } from './syneyScmClient'
import {
  fetchWithTimeout,
  LOGIN_PAGE_URL,
  loginToScm,
  parseGridData,
  SCM_BASE_URL,
} from './syneyScmClient'

export type { SyneyServerEnv } from './syneyScmClient'

const STORE_REPORT_URL
  = `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx?method=BindGrid`
const REPORT_PAGE_URL
  = `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx`

const BIND_FIELDS = [
  '',
  'No',
  'CreateOn',
  'SupplierName',
  'InventoryOrderStatus',
  'SupplierCode',
  'SortNo',
  'PartNo',
  'PartName',
  'Spec',
  'ParamSpec',
  'Qty',
  'Unit',
  'TaxUnitPrice',
  'SupplierWeight',
  'SyneyWeight',
  'CalculateUnit',
  'HasReturn',
  'ReturnQty',
  'DeliveryOrderNo',
  'DeliveryPartSortNo',
  'PONo',
  'EndDate',
  'AuditDate',
  'Address',
  'SONo',
  'InventoryType',
  'Remark',
].join(',')

export async function fetchSyneyStoreReportFromServer(
  env: SyneyServerEnv,
  storeInNo: string,
) {
  const cookie = await loginToScm(env)
  await fetchWithTimeout(
    REPORT_PAGE_URL,
    {
      headers: {
        Cookie: cookie,
        Referer: LOGIN_PAGE_URL,
      },
    },
    '西尼 SCM 入库单页面请求超时',
  )

  const body = new URLSearchParams({
    BindFields: BIND_FIELDS,
    SearchParams: `&QUERY_S_No=${storeInNo}`,
    pageIndex: '0',
    pageSize: '200',
    sortField: 'CreateOn',
    sortOrder: 'desc',
  })

  const response = await fetchWithTimeout(
    STORE_REPORT_URL,
    {
      method: 'POST',
      headers: {
        'Accept': 'text/plain, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie,
        'Origin': SCM_BASE_URL,
        'Referer': REPORT_PAGE_URL,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body,
    },
    '西尼 SCM 入库单查询超时',
  )

  const responseText = await response.text()
  if (!response.ok) {
    throw new Error(responseText || '西尼 SCM 入库单获取失败')
  }

  return parseGridData(responseText)
}
