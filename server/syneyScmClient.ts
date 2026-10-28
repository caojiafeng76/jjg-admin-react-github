import { createHash } from 'node:crypto'

export const SCM_BASE_URL = 'http://scm.syney.net:808'
export const SCM_BUSINESS_URL = `${SCM_BASE_URL}/Business`
const LOGIN_URL = `${SCM_BUSINESS_URL}/UserLogin.aspx?method=Login`
export const LOGIN_PAGE_URL = `${SCM_BUSINESS_URL}/UserLogin.aspx`
const DEFAULT_REQUEST_TIMEOUT_MS = 20000

export type SyneyServerEnv = Record<string, string | undefined>

/** 可以直接展示给用户的 SCM 业务错误（如 SCM 返回的提示、前置校验失败） */
export class ScmUserError extends Error {
  override name = 'ScmUserError'
}

export function md5(value: string) {
  return createHash('md5').update(value).digest('hex')
}

export function getPasswordHash(env: SyneyServerEnv) {
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

export interface ScmTraceEntry {
  time: string
  method: string
  url: string
  /** 表单字段；PassWord 已打码 */
  fields?: Record<string, string>
  /** 只记 cookie 名，不记值 */
  cookieNames: string[]
  status: number
  redirected: boolean
  finalUrl: string
  setCookieNames: string[]
  contentType: string
  length: number
  head: string
}

let scmTrace: ((entry: ScmTraceEntry) => void) | null = null

/** 仅开发环境使用：记录每个发往 SCM 的请求与返回开头，便于排查 SCM 返回空内容等问题 */
export function setScmTrace(trace: ((entry: ScmTraceEntry) => void) | null) {
  scmTrace = trace
}

async function traceScmRequest(input: string, init: RequestInit, response: Response) {
  if (!scmTrace)
    return
  const headers = new Headers(init.headers)
  const fields = init.body instanceof URLSearchParams
    ? Object.fromEntries(
        Array.from(init.body.entries()).map(([key, value]) => [
          key,
          /password/i.test(key) ? '***' : value,
        ]),
      )
    : undefined
  const contentType = response.headers.get('content-type') || ''
  const text = /text|json|javascript|html|xml/i.test(contentType) || !contentType
    ? await response.clone().text()
    : ''
  scmTrace({
    time: new Date().toISOString(),
    method: init.method || 'GET',
    url: input,
    fields,
    cookieNames: (headers.get('cookie') || '')
      .split(';')
      .map(pair => pair.split('=')[0]?.trim())
      .filter(Boolean),
    status: response.status,
    redirected: response.redirected,
    finalUrl: response.url,
    setCookieNames: getSetCookieValues(response.headers).map(value => value.split('=')[0]?.trim()),
    contentType,
    length: text.length,
    head: text.slice(0, 800),
  })
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMessage: string,
  timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })
    await traceScmRequest(input, init, response).catch(() => {})
    return response
  }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(timeoutMessage, { cause: error })
    }

    throw error
  }
  finally {
    clearTimeout(timeoutId)
  }
}

async function loginWithCookieMap(env: SyneyServerEnv) {
  const username = env.SYNEY_SCM_USERNAME?.trim()
  const passwordHash = getPasswordHash(env)

  if (!username || !passwordHash) {
    throw new ScmUserError('西尼 SCM 账号环境变量未配置')
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
        'Referer': LOGIN_PAGE_URL,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: loginBody,
    },
    '西尼 SCM 登录请求超时',
  )

  appendResponseCookies(cookieMap, loginResponse)

  const loginText = await loginResponse.text()
  if (!loginResponse.ok || !loginText.includes('成功')) {
    const detail = sanitizeScmMessage(loginText, 200)
    throw new ScmUserError(`西尼 SCM 登录失败${detail ? `：${detail}` : ''}`)
  }

  return { cookieMap, username }
}

export async function loginToScm(env: SyneyServerEnv) {
  const { cookieMap } = await loginWithCookieMap(env)
  return serializeCookies(cookieMap)
}

/** 登录页 login.js `SetLastUser` 写入的「上次登录用户」cookie 名 */
const LAST_USER_COOKIE = '49BAC005-7D5B-4231-8CEA-16939BEACD67'
const MAIN_PAGE_URL = `${SCM_BUSINESS_URL}/Main.aspx`

/**
 * 按浏览器的顺序建立 SCM 会话：登录 → 写入「上次登录用户」cookie → 进入 Main.aspx。
 * 只登录不进主框架时，采购订单履行等页面的查询会返回空内容（SCM 依赖主框架初始化的会话数据）。
 * login.js 还会把密码明文写进 cookie，这里不模仿。
 */
export async function openScmSession(env: SyneyServerEnv) {
  const { cookieMap, username } = await loginWithCookieMap(env)
  cookieMap.set(LAST_USER_COOKIE, encodeURIComponent(username))

  const mainResponse = await fetchWithTimeout(
    MAIN_PAGE_URL,
    {
      headers: {
        Cookie: serializeCookies(cookieMap),
        Referer: LOGIN_PAGE_URL,
      },
    },
    '西尼 SCM 主页请求超时',
  )
  appendResponseCookies(cookieMap, mainResponse)

  const mainHtml = await mainResponse.text()
  if (isScmLoginRedirect(mainHtml) || /UserLogin\.aspx/i.test(mainResponse.url)) {
    throw new ScmUserError('西尼 SCM 登录状态无效：进入主页时被跳转到登录页')
  }

  return serializeCookies(cookieMap)
}

export function extractDataArray(responseText: string) {
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
    }
    else if (char === ']') {
      depth--
      if (depth === 0) {
        return responseText.substring(startIndex, i + 1)
      }
    }
  }

  return ''
}

/** 解析 MiniUI datagrid（`?method=BindGrid`）返回的 `{ total, data: [...] }` */
export function parseGridData<T = Record<string, unknown>>(responseText: string): T[] {
  const dataArrayText = extractDataArray(responseText)

  if (!dataArrayText) {
    throw new Error('西尼 SCM 返回数据格式不正确')
  }

  return JSON.parse(dataArrayText) as T[]
}

export function scmPageUrl(pagePath: string) {
  return `${SCM_BUSINESS_URL}/${pagePath}`
}

/** SCM 未登录时页面只返回一段脚本：`window.top.location.href=".../UserLogin.aspx?tar=UnKnowUser"` */
export function isScmLoginRedirect(text: string) {
  return /UserLogin\.aspx\?tar=UnKnowUser/i.test(text)
}

/**
 * 说明一段无法按预期解析的 SCM 返回内容：空、跳回登录页，或附上原文片段。
 * 清理 HTML 后为空时（例如只有 <script>）给出压缩后的原始片段，便于定位。
 */
export function describeScmResponse(text: string) {
  if (!text.trim())
    return 'SCM 返回内容为空'
  if (isScmLoginRedirect(text))
    return 'SCM 登录状态无效，被跳转到登录页'
  const sanitized = sanitizeScmMessage(text, 200)
  if (sanitized)
    return sanitized
  return `原始内容：${text.replace(/\s+/g, ' ').trim().slice(0, 200)}`
}

/** 打开页面一次，让 SCM 初始化该页面的会话状态（与浏览器访问顺序一致） */
export async function warmUpScmPage(cookie: string, pagePath: string) {
  const response = await fetchWithTimeout(
    scmPageUrl(pagePath),
    {
      headers: {
        Cookie: cookie,
        Referer: LOGIN_PAGE_URL,
      },
    },
    '西尼 SCM 页面请求超时',
  )

  const html = await response.text()
  if (isScmLoginRedirect(html)) {
    throw new ScmUserError(
      `西尼 SCM 登录状态无效：打开 ${pagePath} 时被跳转到登录页，请确认账号有该页面权限`,
    )
  }
  return html
}

/**
 * 以 jQuery `$.ajax` 表单方式向 SCM 页面提交数据。
 * `query` 为 `?` 之后的部分，例如 `method=BindGrid&Type=NPO`。
 * `label` 是这一步的中文名称，出错时提示「<label>失败（HTTP 500）：SCM 原文」，便于定位。
 */
export async function postScmForm(
  cookie: string,
  pagePath: string,
  query: string,
  fields: Record<string, string>,
  label = '西尼 SCM 请求',
) {
  const pageUrl = scmPageUrl(pagePath)
  const response = await fetchWithTimeout(
    `${pageUrl}?${query}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'text/plain, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': cookie,
        'Origin': SCM_BASE_URL,
        'Referer': pageUrl,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams(fields),
    },
    `${label}超时`,
  )

  const responseText = await response.text()
  if (!response.ok) {
    const detail = sanitizeScmMessage(responseText)
    throw new ScmUserError(
      `${label}失败（HTTP ${response.status}）${detail ? `：${detail}` : ''}`,
    )
  }

  return responseText
}

/** MiniUI datagrid 查询：`BindFields` 以逗号开头，与页面 `GetGridFields` 一致 */
export async function bindScmGrid<T = Record<string, unknown>>(
  cookie: string,
  pagePath: string,
  query: string,
  fields: readonly string[],
  searchParams: string,
  {
    label = '西尼 SCM 查询',
    pageSize = 500,
    sortField = 'PKID',
    sortOrder = 'desc',
  }: { label?: string, pageSize?: number, sortField?: string, sortOrder?: string } = {},
) {
  const responseText = await postScmForm(
    cookie,
    pagePath,
    query,
    {
      BindFields: `,${fields.join(',')}`,
      SearchParams: searchParams,
      pageIndex: '0',
      pageSize: String(pageSize),
      sortField,
      sortOrder,
    },
    label,
  )

  // SCM 的 BindGrid 在查询结果为 0 条时返回空内容（不是 `{ data: [] }`），按空列表处理
  if (!responseText.trim()) {
    return []
  }

  try {
    return parseGridData<T>(responseText)
  }
  catch {
    throw new ScmUserError(`${label}返回的数据无法解析：${describeScmResponse(responseText)}`)
  }
}

/**
 * `CommonServer.AjaxSubmit` 的 URL：`<页面>.aspx?method=<方法>&methodDec=<描述>&`
 */
export function ajaxMethodQuery(method: string, methodDec = '未知操作') {
  return `method=${encodeURIComponent(method)}&methodDec=${encodeURIComponent(methodDec)}&`
}

/** 去掉 HTML 标签与多余空白，截断长度，避免把整页错误 HTML 透传给前端 */
export function sanitizeScmMessage(text: string, maxLength = 300) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}
