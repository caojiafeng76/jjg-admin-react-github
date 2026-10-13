/**
 * Supabase 客户端使用的 fetch：网络层失败（如移动网络偶发 Failed to fetch）时自动重试。
 *
 * - 只重试 fetch 抛出的网络错误，HTTP 4xx/5xx 响应原样返回，交给调用方处理
 * - 只重试 GET/HEAD 等幂等请求，写操作和 RPC（POST）不重试，避免重复写入
 * - 登录态刷新由 supabase auth-js 自带的网络错误重试负责，这里不重复处理
 * - 请求被取消（AbortSignal）时立即停止，不再重试
 */

export interface RetryingFetchOptions {
  /** 每次重试前的等待毫秒数，数组长度即最大重试次数 */
  retryDelays?: number[]
}

const DEFAULT_RETRY_DELAYS = [300, 1000]
const RETRYABLE_METHODS = new Set(['GET', 'HEAD'])

function getRequestMethod(
  input: RequestInfo | URL,
  init?: RequestInit,
): string {
  const method =
    init?.method ?? (input instanceof Request ? input.method : undefined)
  return (method ?? 'GET').toUpperCase()
}

function getRequestSignal(
  input: RequestInfo | URL,
  init?: RequestInit,
): AbortSignal | null | undefined {
  return init?.signal ?? (input instanceof Request ? input.signal : undefined)
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

/** fetch 在网络层失败时抛出 TypeError（Chrome: Failed to fetch，Safari: Load failed） */
function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError
}

function createAbortError(signal: AbortSignal): unknown {
  return (
    signal.reason ??
    new DOMException('The operation was aborted.', 'AbortError')
  )
}

function wait(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError(signal))
      return
    }

    const onAbort = () => {
      clearTimeout(timer)
      reject(createAbortError(signal as AbortSignal))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

export function createRetryingFetch(
  baseFetch: typeof fetch = (...args) => fetch(...args),
  { retryDelays = DEFAULT_RETRY_DELAYS }: RetryingFetchOptions = {},
): typeof fetch {
  return async function retryingFetch(input, init) {
    const canRetry = RETRYABLE_METHODS.has(getRequestMethod(input, init))
    const signal = getRequestSignal(input, init)

    for (let attempt = 0; ; attempt += 1) {
      // Request 对象只能消费一次，重试时复制一份
      const requestInput =
        canRetry && input instanceof Request ? input.clone() : input

      try {
        return await baseFetch(requestInput, init)
      } catch (error) {
        const delay = retryDelays[attempt]
        if (
          !canRetry ||
          delay === undefined ||
          isAbortError(error) ||
          signal?.aborted ||
          !isNetworkError(error)
        ) {
          throw error
        }

        await wait(delay, signal)
      }
    }
  }
}
