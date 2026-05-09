import { createHash } from 'node:crypto'

const SCM_BASE_URL = 'http://scm.syney.net:808'
const LOGIN_URL = `${SCM_BASE_URL}/Business/UserLogin.aspx?method=Login`
const STORE_REPORT_URL =
  `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx?method=BindGrid`
const LOGIN_PAGE_URL = `${SCM_BASE_URL}/Business/UserLogin.aspx`
const REPORT_PAGE_URL =
  `${SCM_BASE_URL}/Business/Supplier/SupplierStoreInReport.aspx`
const REQUEST_TIMEOUT_MS = 20000

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

export type SyneyServerEnv = Record<string, string | undefined>

function md5(value: string) {
  return createHash('md5').update(value).digest('hex')
}

function getPasswordHash(env: SyneyServerEnv) {
  return env.SYNEY_SCM_PASSWORD_MD5?.trim() || md5(env.SYNEY_SCM_PASSWORD || '')
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

async function loginToScm(env: SyneyServerEnv) {
  const username = env.SYNEY_SCM_USERNAME?.trim()
  const passwordHash = getPasswordHash(env)

  if (!username || !passwordHash) {
    throw new Error('西尼 SCM 账号环境变量未配置')
  }

  const loginBody = new URLSearchParams({
    UserName: username,
    PassWord: passwordHash,
  })
  const cookieMap = new Map<string, string>()
  const loginResponse = await fetchWithTimeout(
    LOGIN_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Referer: LOGIN_PAGE_URL,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: loginBody,
    },
    '西尼 SCM 登录请求超时',
  )

  appendResponseCookies(cookieMap, loginResponse)

  const loginText = await loginResponse.text()
  if (!loginResponse.ok || !loginText.includes('成功')) {
    throw new Error(loginText || '西尼 SCM 登录失败')
  }

  return serializeCookies(cookieMap)
}

function extractDataArray(responseText: string) {
  const dataKeyStart = responseText.indexOf('data')
  if (dataKeyStart === -1) {
    return ''
  }

  const colonIndex = responseText.indexOf(':', dataKeyStart)
  if (colonIndex === -1) {
    return ''
  }

  let startIndex = colonIndex + 1
  while (startIndex < responseText.length && /\s/.test(responseText[startIndex])) {
    startIndex++
  }

  if (responseText[startIndex] !== '[') {
    return ''
  }

  let depth = 1
  let inString = false
  let escaped = false

  for (let i = startIndex + 1; i < responseText.length; i++) {
    const char = responseText[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '[') {
      depth++
    } else if (char === ']') {
      depth--
      if (depth === 0) {
        return responseText.substring(startIndex, i + 1)
      }
    }
  }

  return ''
}

function parseStoreReportResponse(responseText: string) {
  const dataArrayText = extractDataArray(responseText)

  if (!dataArrayText) {
    throw new Error('西尼 SCM 返回数据格式不正确')
  }

  return JSON.parse(dataArrayText)
}

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
        Accept: 'text/plain, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookie,
        Origin: SCM_BASE_URL,
        Referer: REPORT_PAGE_URL,
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

  return parseStoreReportResponse(responseText)
}
