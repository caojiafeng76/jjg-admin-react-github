import { App } from 'antd'

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
  NETWORK_ERROR: '网络连接失败,请检查网络设置',
  UNAUTHORIZED: '未授权,请重新登录',
  FORBIDDEN: '没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '数据验证失败',
  SERVER_ERROR: '服务器错误,请稍后重试',
  UNKNOWN_ERROR: '发生未知错误',
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
}

const ERROR_MESSAGE_PARTIAL_TRANSLATIONS: Array<[string, string]> = [
  ['violates row-level security policy', '没有权限执行当前操作，请确认数据库权限策略已生效'],
  ['permission denied for table', '没有权限访问当前数据表'],
  ['permission denied', '没有权限执行当前操作'],
]

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
    statusCode === 404 ||
    normalizedCode === 'not_found' ||
    normalizedMessage.includes('not found') ||
    normalizedMessage.includes('不存在') ||
    normalizedMessage.includes('未找到')
  ) {
    return 'notFound'
  }

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    normalizedCode === 'unauthorized' ||
    normalizedCode === 'forbidden' ||
    normalizedCode === '42501' ||
    normalizedMessage.includes('permission denied') ||
    normalizedMessage.includes('row-level security') ||
    normalizedMessage.includes('认证') ||
    normalizedMessage.includes('未授权') ||
    normalizedMessage.includes('没有权限') ||
    normalizedMessage.includes('权限')
  ) {
    return 'permission'
  }

  if (
    normalizedCode === 'network_error' ||
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('networkerror') ||
    normalizedMessage.includes('network error') ||
    normalizedMessage.includes('load failed') ||
    normalizedMessage.includes('fetch') ||
    normalizedMessage.includes('网络') ||
    normalizedMessage.includes('连接失败')
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

    const primaryMessage =
      stringifyErrorField(parsed.message) ||
      stringifyErrorField(parsed.error_description) ||
      stringifyErrorField(parsed.hint)

    const detailParts = [
      stringifyErrorField(parsed.details),
      stringifyErrorField(parsed.hint),
    ].filter((part): part is string => Boolean(part))

    return {
      category: getErrorCategory({
        message: prefix || primaryMessage || trimmedMessage,
        code: stringifyErrorField(parsed.code),
      }),
      message: translateErrorMessage(prefix || primaryMessage || trimmedMessage),
      detail:
        detailParts.length > 0
          ? detailParts.map((part) => translateErrorMessage(part)).join('；')
          : undefined,
      code: stringifyErrorField(parsed.code),
    }
  } catch {
    return null
  }
}

export function getErrorDisplayInfo(
  error: unknown,
  fallbackMessage = '系统暂时不可用，请稍后重试。',
): ErrorDisplayInfo {
  const errorCode =
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : undefined

  const statusCode =
    error &&
    typeof error === 'object' &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
      ? error.statusCode
      : undefined

  const rawDetail =
    error &&
    typeof error === 'object' &&
    'details' in error &&
    typeof error.details === 'string'
      ? error.details
      : undefined

  if (typeof error === 'string') {
    return parseJsonLikeError(error) || {
      category: getErrorCategory({ message: error, code: errorCode, statusCode }),
      message: translateErrorMessage(error),
      code: errorCode,
    }
  }

  if (error instanceof Error) {
    return parseJsonLikeError(error.message) || {
      category: getErrorCategory({
        message: error.message || fallbackMessage,
        code: errorCode,
        statusCode,
      }),
      message: translateErrorMessage(error.message || fallbackMessage),
      detail: rawDetail,
      code: errorCode,
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = stringifyErrorField(error.message)

    if (message) {
      return parseJsonLikeError(message) || {
        category: getErrorCategory({ message, code: errorCode, statusCode }),
        message: translateErrorMessage(message),
        detail: rawDetail,
        code: errorCode,
      }
    }
  }

  return {
    category: getErrorCategory({ message: fallbackMessage, code: errorCode, statusCode }),
    message: fallbackMessage,
    detail: rawDetail,
    code: errorCode,
  }
}

/**
 * 处理 API 错误
 */
export function handleApiError(
  error: unknown,
  customMessage?: string,
): AppError {
  // 忽略 AbortError（请求被取消是正常行为，不应该作为错误处理）
  if (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    (error.name === 'AbortError' ||
      (error as { message?: string }).message?.includes('aborted'))
  ) {
    // 返回一个特殊的 AppError，但标记为可忽略
    const abortError = new AppError('请求已取消', 'ABORT_ERROR', 0, error)
    abortError.name = 'AbortError'
    return abortError
  }

  console.error('API Error:', error)

  // 如果已经是 AppError,直接返回
  if (error instanceof AppError) {
    return error
  }

  // 处理 Supabase 错误
  if (error && typeof error === 'object' && 'message' in error) {
    const supabaseError = error as { message: string; code?: string }
    const originalMessage = customMessage
      ? `${customMessage}: ${supabaseError.message}`
      : supabaseError.message
    const translatedMessage = translateErrorMessage(originalMessage)
    return new AppError(translatedMessage, supabaseError.code)
  }

  // 处理网络错误
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(ERROR_MESSAGES.NETWORK_ERROR, 'NETWORK_ERROR', 0, error)
  }

  // 未知错误
  return new AppError(
    customMessage || ERROR_MESSAGES.UNKNOWN_ERROR,
    'UNKNOWN_ERROR',
    500,
    error,
  )
}

/**
 * 显示错误通知的 Hook
 * 需要在 Ant Design App 组件内部使用
 */
export function useErrorHandler() {
  const { message } = App.useApp()

  const showError = (error: unknown, fallbackMessage?: string) => {
    const appError = handleApiError(error, fallbackMessage)
    // 忽略 AbortError（请求被取消是正常行为，不应该显示错误）
    if (appError.name === 'AbortError' || appError.code === 'ABORT_ERROR') {
      return
    }
    message.error(appError.message)
  }

  const showSuccess = (msg: string) => {
    message.success(msg)
  }

  const showWarning = (msg: string) => {
    message.warning(msg)
  }

  const showInfo = (msg: string) => {
    message.info(msg)
  }

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
  }
}

/**
 * 全局错误处理函数(不依赖 React Context)
 * 用于在非组件环境中显示错误
 */
export function showErrorNotification(error: unknown, customMessage?: string) {
  const appError = handleApiError(error, customMessage)
  console.error('Error:', appError)
  // 这里可以集成其他通知方式,如 toast
  return appError
}
