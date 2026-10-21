/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  code?: string
  statusCode?: number
  details?: unknown

  constructor(
    message: string,
    code?: string,
    statusCode?: number,
    details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

/**
 * 错误类型映射
 */
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  UNAUTHORIZED: '未授权，请重新登录',
  FORBIDDEN: '没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '数据验证失败',
  SERVER_ERROR: '服务器错误，请稍后重试',
  UNKNOWN_ERROR: '操作失败，请稍后重试',
}

/**
 * 错误消息翻译映射（将英文错误消息翻译为中文）
 */
const ERROR_MESSAGE_TRANSLATIONS: Record<string, string> = {
  'Auth session missing!': '认证会话缺失，请重新登录',
  'Auth session missing': '认证会话缺失，请重新登录',
  'Invalid login credentials': '登录凭据无效，请检查邮箱和密码',
  'Email not confirmed': '邮箱未确认，请先验证邮箱',
  'User not found': '用户不存在',
  'Invalid password': '密码错误',
  'JWT expired': '登录已过期，请重新登录',
  'Failed to fetch': '网络连接失败，请检查网络设置',
}

const ERROR_MESSAGE_PARTIAL_TRANSLATIONS: Array<[string, string]> = [
  [
    'youmai_finished_goods_inventory_current_stock_non_negative',
    '优迈成品库存不足，无法反审入库；请先反审/删除后续出库或补足库存后再操作',
  ],
  [
    'violates row-level security policy',
    '没有权限执行当前操作，请确认数据库权限策略已生效',
  ],
  ['permission denied for table', '没有权限访问当前数据表'],
  ['permission denied', '没有权限执行当前操作'],
]

/**
 * Postgres / PostgREST 错误码 → 用户可读原因
 */
const ERROR_CODE_TRANSLATIONS: Record<string, string> = {
  '23505': '数据已存在，请勿重复提交',
  '23503': '数据被其他记录引用，或关联的数据不存在',
  '23502': '缺少必填字段',
  '23514': '数据不符合校验规则',
  '22P02': '数据格式不正确',
  '22001': '输入内容超出长度限制',
  '42501': '没有权限执行当前操作',
  'PGRST116': '数据不存在或已被删除',
  'PGRST301': '登录已过期，请重新登录',
}

const CJK_PATTERN = /[\u4E00-\u9FFF]/

/** 文本是否包含中文（数据库 RAISE / 业务校验抛出的中文原因可直接展示给用户） */
function containsChinese(text: string | undefined): text is string {
  return !!text && CJK_PATTERN.test(text)
}

/**
 * 把底层错误翻译为用户可读的中文原因；无法识别的英文错误返回 undefined
 */
function resolveUserReason(message: string, code?: string): string | undefined {
  const translated = translateErrorMessage(message)
  if (translated !== message)
    return translated

  if (code && ERROR_CODE_TRANSLATIONS[code])
    return ERROR_CODE_TRANSLATIONS[code]

  return containsChinese(message) ? message : undefined
}

/**
 * 翻译错误消息
 */
export function translateErrorMessage(message: string): string {
  const exactMatch = ERROR_MESSAGE_TRANSLATIONS[message]

  if (exactMatch) {
    return exactMatch
  }

  const partialMatch = ERROR_MESSAGE_PARTIAL_TRANSLATIONS.find(([pattern]) =>
    message.includes(pattern),
  )

  return partialMatch?.[1] || message
}

export interface ErrorDisplayInfo {
  category: 'generic' | 'network' | 'permission' | 'notFound'
  message: string
  detail?: string
  code?: string
}

function getErrorCategory({
  message,
  code,
  statusCode,
}: {
  message?: string
  code?: string
  statusCode?: number
}): ErrorDisplayInfo['category'] {
  const normalizedMessage = message?.toLowerCase() || ''
  const normalizedCode = code?.toLowerCase() || ''

  if (
    statusCode === 404
    || normalizedCode === 'not_found'
    || normalizedMessage.includes('not found')
    || normalizedMessage.includes('不存在')
    || normalizedMessage.includes('未找到')
  ) {
    return 'notFound'
  }

  if (
    statusCode === 401
    || statusCode === 403
    || normalizedCode === 'unauthorized'
    || normalizedCode === 'forbidden'
    || normalizedCode === '42501'
    || normalizedMessage.includes('permission denied')
    || normalizedMessage.includes('row-level security')
    || normalizedMessage.includes('认证')
    || normalizedMessage.includes('未授权')
    || normalizedMessage.includes('没有权限')
    || normalizedMessage.includes('权限')
  ) {
    return 'permission'
  }

  if (
    normalizedCode === 'network_error'
    || normalizedMessage.includes('failed to fetch')
    || normalizedMessage.includes('networkerror')
    || normalizedMessage.includes('network error')
    || normalizedMessage.includes('load failed')
    || normalizedMessage.includes('fetch')
    || normalizedMessage.includes('网络')
    || normalizedMessage.includes('连接失败')
  ) {
    return 'network'
  }

  return 'generic'
}

function stringifyErrorField(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return undefined
}

function parseJsonLikeError(message: string): ErrorDisplayInfo | null {
  const trimmedMessage = message.trim()
  const jsonStartIndex = trimmedMessage.indexOf('{')

  if (jsonStartIndex === -1) {
    return null
  }

  const jsonText = trimmedMessage.slice(jsonStartIndex)

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>
    const prefix = trimmedMessage
      .slice(0, jsonStartIndex)
      .trim()
      .replace(/[：:]$/, '')

    const primaryMessage
      = stringifyErrorField(parsed.message)
        || stringifyErrorField(parsed.error_description)
        || stringifyErrorField(parsed.hint)

    const detailParts = [
      stringifyErrorField(parsed.details),
      stringifyErrorField(parsed.hint),
    ].filter((part): part is string => Boolean(part))

    return {
      category: getErrorCategory({
        message: prefix || primaryMessage || trimmedMessage,
        code: stringifyErrorField(parsed.code),
      }),
      message: translateErrorMessage(
        prefix || primaryMessage || trimmedMessage,
      ),
      detail:
        detailParts.length > 0
          ? detailParts.map(part => translateErrorMessage(part)).join('；')
          : undefined,
      code: stringifyErrorField(parsed.code),
    }
  }
  catch {
    return null
  }
}

export function getErrorDisplayInfo(
  error: unknown,
  fallbackMessage = '系统暂时不可用，请稍后重试。',
): ErrorDisplayInfo {
  const errorCode
    = error
      && typeof error === 'object'
      && 'code' in error
      && typeof error.code === 'string'
      ? error.code
      : undefined

  const statusCode
    = error
      && typeof error === 'object'
      && 'statusCode' in error
      && typeof error.statusCode === 'number'
      ? error.statusCode
      : undefined

  const rawDetail
    = error
      && typeof error === 'object'
      && 'details' in error
      && typeof error.details === 'string'
      ? error.details
      : undefined

  if (typeof error === 'string') {
    return (
      parseJsonLikeError(error) || {
        category: getErrorCategory({
          message: error,
          code: errorCode,
          statusCode,
        }),
        message: translateErrorMessage(error),
        code: errorCode,
      }
    )
  }

  if (error instanceof Error) {
    return (
      parseJsonLikeError(error.message) || {
        category: getErrorCategory({
          message: error.message || fallbackMessage,
          code: errorCode,
          statusCode,
        }),
        message: translateErrorMessage(error.message || fallbackMessage),
        detail: rawDetail,
        code: errorCode,
      }
    )
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = stringifyErrorField(error.message)

    if (message) {
      return (
        parseJsonLikeError(message) || {
          category: getErrorCategory({ message, code: errorCode, statusCode }),
          message: translateErrorMessage(message),
          detail: rawDetail,
          code: errorCode,
        }
      )
    }
  }

  return {
    category: getErrorCategory({
      message: fallbackMessage,
      code: errorCode,
      statusCode,
    }),
    message: fallbackMessage,
    detail: rawDetail,
    code: errorCode,
  }
}

/**
 * 获取可展示给用户的中文错误消息（用于 toast）
 *
 * - 已识别的错误 / 中文业务错误：返回中文原因
 * - 无法识别的英文原文：返回 fallback（原文请用 getErrorTechnicalDetail 展示在可展开详情中）
 */
export function getUserErrorMessage(
  error: unknown,
  fallback = ERROR_MESSAGES.UNKNOWN_ERROR,
): string {
  const info = getErrorDisplayInfo(error, fallback)

  if (containsChinese(info.message))
    return info.message

  const reason = resolveUserReason(info.message, info.code)
  if (reason)
    return reason

  if (info.category === 'network')
    return ERROR_MESSAGES.NETWORK_ERROR
  if (info.category === 'permission')
    return ERROR_MESSAGES.FORBIDDEN

  return fallback
}

/**
 * 获取错误的技术详情（错误码、数据库原文等），用于“技术详情”折叠区，便于反馈给开发
 */
export function getErrorTechnicalDetail(error: unknown): string | undefined {
  const info = getErrorDisplayInfo(error, '')
  const parts = [
    info.code ? `错误码：${info.code}` : undefined,
    containsChinese(info.message) ? undefined : info.message,
    info.detail,
  ].filter((part): part is string => !!part && part.trim().length > 0)

  const unique = [...new Set(parts)]
  return unique.length > 0 ? unique.join('\n') : undefined
}

/**
 * 处理 API 错误
 *
 * 返回的 AppError.message 始终是可直接展示的中文：
 * `${customMessage}：${中文原因}`，原因无法识别时仅为 customMessage；
 * 数据库英文原文保存在 AppError.details 中（技术详情）。
 */
export function handleApiError(
  error: unknown,
  customMessage?: string,
): AppError {
  // 忽略 AbortError（请求被取消是正常行为，不应该作为错误处理）
  if (
    error
    && typeof error === 'object'
    && 'name' in error
    && (error.name === 'AbortError'
      || (error as { message?: string }).message?.includes('aborted'))
  ) {
    // 返回一个特殊的 AppError，但标记为可忽略
    const abortError = new AppError('请求已取消', 'ABORT_ERROR', 0, error)
    abortError.name = 'AbortError'
    return abortError
  }

  console.error('API Error:', error)

  // 如果已经是 AppError，直接返回
  if (error instanceof AppError) {
    return error
  }

  const withPrefix = (reason: string) =>
    customMessage ? `${customMessage}：${reason}` : reason

  // 处理网络错误（TypeError: Failed to fetch 也带 message，需先于通用分支判断）
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      withPrefix(ERROR_MESSAGES.NETWORK_ERROR),
      'NETWORK_ERROR',
      0,
      error.message,
    )
  }

  // 处理 Supabase / PostgREST 错误
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as {
      message: string
      code?: string
      details?: string | null
      hint?: string | null
    }
    const technicalDetail = [
      supabaseError.message,
      supabaseError.details,
      supabaseError.hint,
    ]
      .filter((part): part is string => !!part)
      .join('；')
    const reason = resolveUserReason(supabaseError.message, supabaseError.code)
    const category = getErrorCategory({
      message: supabaseError.message,
      code: supabaseError.code,
    })
    const userMessage = reason
      ? withPrefix(reason)
      : category === 'network'
        ? withPrefix(ERROR_MESSAGES.NETWORK_ERROR)
        : category === 'permission'
          ? withPrefix(ERROR_MESSAGES.FORBIDDEN)
          : customMessage || ERROR_MESSAGES.UNKNOWN_ERROR

    return new AppError(
      userMessage,
      supabaseError.code,
      undefined,
      technicalDetail || undefined,
    )
  }

  // 未知错误
  return new AppError(
    customMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
    'UNKNOWN_ERROR',
    500,
    typeof error === 'string' ? error : undefined,
  )
}
