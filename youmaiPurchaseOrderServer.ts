const YOUMAI_SRM_BASE_URL = 'https://srm.hzoptimax.com/saafbase'
const LOGIN_URL = `${YOUMAI_SRM_BASE_URL}/restServer/saafLoginServlet/login`
const ORDER_LIST_URL =
  `${YOUMAI_SRM_BASE_URL}/restServer/purchaseOrderServices/findOrderInfoList`
const ORDER_LINES_URL =
  `${YOUMAI_SRM_BASE_URL}/restServer/purchaseOrderServices/findOrderInfo`
const REQUEST_TIMEOUT_MS = 20000

export type YoumaiPurchaseOrderServerEnv = Record<string, string | undefined>

export interface YoumaiPurchaseOrderLine {
  purchase_order_no: string
  purchase_order_line_no: string
  material_code: string
  material_name: string
  delivery_date: string
  stock_out_quantity: number
  remarks: string
}

interface YoumaiSrmLoginData {
  sessionId?: string
  tokeCode?: string
}

interface YoumaiSrmResponse<T> {
  status?: string
  msg?: string
  data?: T
  count?: number
}

interface YoumaiSrmOrderHeader {
  poHeaderId?: number | string
  poNumber?: string
}

interface YoumaiSrmOrderLine {
  poNumber?: string
  lineNumber?: number | string
  itemCode?: string
  itemName?: string
  demandQty?: number | string
  demandDate?: string
  description?: string
  lineDescription?: string
  contractNumber?: string
  packingItem?: string
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeQuantity(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function getCredentials(env: YoumaiPurchaseOrderServerEnv) {
  const username = env.YOUMAI_SRM_USERNAME?.trim()
  const password = env.YOUMAI_SRM_PASSWORD?.trim()

  if (!username || !password) {
    throw new Error('优迈 SRM 账号环境变量未配置')
  }

  return { username, password }
}

function getSetCookieValues(headers: Headers) {
  const maybeHeadersWithSetCookie = headers as Headers & {
    getSetCookie?: () => string[]
  }

  const setCookies = maybeHeadersWithSetCookie.getSetCookie?.()
  if (setCookies?.length) {
    return setCookies
  }

  const setCookie = headers.get('set-cookie')
  return setCookie ? [setCookie] : []
}

function appendResponseCookies(cookieMap: Map<string, string>, response: Response) {
  getSetCookieValues(response.headers).forEach((setCookie) => {
    const [cookiePair] = setCookie.split(';')
    const separatorIndex = cookiePair.indexOf('=')

    if (separatorIndex <= 0) {
      return
    }

    cookieMap.set(
      cookiePair.slice(0, separatorIndex).trim(),
      cookiePair.slice(separatorIndex + 1).trim(),
    )
  })
}

function serializeCookies(cookieMap: Map<string, string>) {
  return Array.from(cookieMap.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ')
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMessage: string,
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(timeoutMessage, { cause: error })
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function postSrmForm<T>({
  url,
  params,
  tokenCode,
  cookie,
  pageRows = '200',
}: {
  url: string
  params: Record<string, unknown>
  tokenCode: string
  cookie: string
  pageRows?: string
}) {
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Cookie: cookie,
        Origin: YOUMAI_SRM_BASE_URL,
        Referer: `${YOUMAI_SRM_BASE_URL}/`,
        TokenCode: tokenCode,
      },
      body: new URLSearchParams({
        params: JSON.stringify(params),
        pageIndex: '1',
        pageRows,
      }),
    },
    '优迈 SRM 请求超时',
  )

  const text = await response.text()
  if (!response.ok) {
    throw new Error(text || '优迈 SRM 请求失败')
  }

  return JSON.parse(text) as YoumaiSrmResponse<T>
}

async function loginToYoumaiSrm(env: YoumaiPurchaseOrderServerEnv) {
  const { username, password } = getCredentials(env)
  const cookieMap = new Map<string, string>()
  const response = await fetchWithTimeout(
    LOGIN_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Referer: `${YOUMAI_SRM_BASE_URL}/`,
      },
      body: new URLSearchParams({
        params: JSON.stringify({
          username,
          password,
          check: '',
        }),
      }),
    },
    '优迈 SRM 登录请求超时',
  )

  appendResponseCookies(cookieMap, response)

  const text = await response.text()
  if (!response.ok) {
    throw new Error(text || '优迈 SRM 登录失败')
  }

  const loginResponse = JSON.parse(text) as YoumaiSrmResponse<string>
  if (loginResponse.status !== 'S' || !loginResponse.data) {
    throw new Error(loginResponse.msg || '优迈 SRM 登录失败')
  }

  const loginData = JSON.parse(loginResponse.data) as YoumaiSrmLoginData
  const sessionId = normalizeText(loginData.sessionId)
  if (sessionId) {
    cookieMap.set('JSESSIONID', sessionId)
  }

  return {
    cookie: serializeCookies(cookieMap),
    tokenCode: normalizeText(loginData.tokeCode),
  }
}

function buildLineRemarks(line: YoumaiSrmOrderLine) {
  return [
    normalizeText(line.description),
    normalizeText(line.lineDescription),
    normalizeText(line.contractNumber)
      ? `合同号：${normalizeText(line.contractNumber)}`
      : '',
    normalizeText(line.packingItem)
      ? `打包件：${normalizeText(line.packingItem)}`
      : '',
  ]
    .filter(Boolean)
    .join(' | ')
    .slice(0, 500)
}

function mapOrderLine(line: YoumaiSrmOrderLine): YoumaiPurchaseOrderLine {
  return {
    purchase_order_no: normalizeText(line.poNumber),
    purchase_order_line_no: normalizeText(line.lineNumber),
    material_code: normalizeText(line.itemCode),
    material_name: normalizeText(line.itemName),
    delivery_date: normalizeText(line.demandDate),
    stock_out_quantity: normalizeQuantity(line.demandQty),
    remarks: buildLineRemarks(line),
  }
}

export async function fetchYoumaiPurchaseOrderFromServer(
  env: YoumaiPurchaseOrderServerEnv,
  purchaseOrderNo: string,
) {
  const normalizedPurchaseOrderNo = normalizeText(purchaseOrderNo)
  if (!normalizedPurchaseOrderNo) {
    throw new Error('请输入采购订单号')
  }

  const session = await loginToYoumaiSrm(env)
  const headerResponse = await postSrmForm<YoumaiSrmOrderHeader[]>({
    url: ORDER_LIST_URL,
    params: { poNumber: normalizedPurchaseOrderNo },
    cookie: session.cookie,
    tokenCode: session.tokenCode,
    pageRows: '20',
  })

  const orderHeader = (headerResponse.data || []).find(
    (item) => normalizeText(item.poNumber) === normalizedPurchaseOrderNo,
  )

  if (!orderHeader?.poHeaderId) {
    throw new Error(`未找到优迈采购订单：${normalizedPurchaseOrderNo}`)
  }

  const linesResponse = await postSrmForm<YoumaiSrmOrderLine[]>({
    url: ORDER_LINES_URL,
    params: { poHeaderId: orderHeader.poHeaderId },
    cookie: session.cookie,
    tokenCode: session.tokenCode,
  })

  const items = (linesResponse.data || []).map(mapOrderLine).filter((line) => {
    return (
      line.purchase_order_no &&
      line.purchase_order_line_no &&
      line.material_code &&
      line.stock_out_quantity > 0 &&
      line.delivery_date
    )
  })

  if (items.length === 0) {
    throw new Error(`优迈采购订单 ${normalizedPurchaseOrderNo} 没有可导入明细`)
  }

  return items
}
