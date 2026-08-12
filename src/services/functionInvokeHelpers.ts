import { FunctionRegion } from '@supabase/supabase-js'

/**
 * Edge Function 调用共享工具。
 * 原为 apiSyneyStoreReports / apiYoumaiPurchaseOrder / apiEmployees /
 * apiAdminManagementPassword / apiProductionOrderExport 五处重复实现，统一收拢于此。
 */

/**
 * 从 FunctionsInvokeError 的 context 中提取 Edge Function 返回的错误信息。
 * - 优先解析 JSON body 中的 error 字段
 * - 无 JSON 时按 HTTP 状态码映射为中文提示
 *
 * @param error - supabase.functions.invoke 抛出的 error
 * @param options.unauthorizedMessage - 401 状态码文案（默认「未登录，无法执行此操作」）
 * @returns 错误信息；无法提取时返回 null
 */
export async function extractFunctionInvokeErrorMessage(
  error: unknown,
  options?: { unauthorizedMessage?: string },
): Promise<string | null> {
  if (!error || typeof error !== 'object') {
    return null
  }

  const maybeContext = (
    error as {
      context?: {
        json?: () => Promise<unknown>
        status?: number
        statusText?: string
      }
    }
  ).context

  if (maybeContext?.json) {
    try {
      const payload = await maybeContext.json()

      if (
        payload &&
        typeof payload === 'object' &&
        'error' in payload &&
        typeof payload.error === 'string' &&
        payload.error.trim()
      ) {
        return payload.error.trim()
      }
    } catch {
      // JSON 解析失败时回退到状态码分支
    }
  }

  // Handle non-JSON responses (e.g. 404 returns plain text instead of JSON).
  // When context.json() is absent, fall back to HTTP status.
  if (maybeContext?.status) {
    const status = maybeContext.status
    if (status === 401) return options?.unauthorizedMessage ?? '未登录，无法执行此操作'
    if (status === 403) return '权限校验失败，无权执行此操作'
    if (status === 404) return 'Edge Function 不存在或未部署'
  }

  return null
}

/**
 * Promise 超时竞速：超时后以 timeoutMessage 拒绝。
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

/**
 * 校验并返回 Supabase Edge Function 区域配置。
 *
 * @param regionEnvValue - 环境变量 VITE_SUPABASE_FUNCTION_REGION 的值
 * @returns 合法的 FunctionRegion；未配置时返回 undefined
 */
export function getFunctionRegion(
  regionEnvValue: string | undefined,
): FunctionRegion | undefined {
  const region = regionEnvValue?.trim()
  if (!region) {
    return undefined
  }

  if (!Object.values(FunctionRegion).includes(region as FunctionRegion)) {
    throw new Error(`Supabase Edge Function 区域配置不正确：${region}`)
  }

  return region as FunctionRegion
}
