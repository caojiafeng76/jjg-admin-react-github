import type {
  SyneyDeliveryOrderAction,
  SyneyDeliveryOrderRequestMap,
  SyneyDeliveryOrderResponseMap,
  SyneySafePartDetailPlanItem,
  SyneySafePartSourceRow,
} from './syneyDeliveryOrderContract'
import { withTimeout } from './functionInvokeHelpers'
import { getAuthenticatedProxyHeaders } from './proxyAuth'
import { SYNEY_DELIVERY_ORDER_DEV_PROXY_URL } from './syneyDeliveryOrderContract'

const SYNEY_DELIVERY_ORDER_API_URL = import.meta.env.VITE_SYNEY_DELIVERY_ORDER_API_URL as string | undefined
/** 单步包含 SCM 登录 + 若干次查询/提交，下载合并文件时更久 */
const DELIVERY_ORDER_STEP_TIMEOUT_MS = 90_000

export function resolveSyneyDeliveryOrderProxyUrl({
  configuredProxyUrl,
  isDev,
}: {
  configuredProxyUrl?: string
  isDev: boolean
}): string {
  if (isDev) {
    return SYNEY_DELIVERY_ORDER_DEV_PROXY_URL
  }

  return configuredProxyUrl?.trim() || ''
}

function isBrowserFetchFailure(error: unknown) {
  return error instanceof TypeError && /fetch|network|load failed/i.test(error.message)
}

export async function callSyneyDeliveryOrderProxy<A extends SyneyDeliveryOrderAction>(
  action: A,
  payload: SyneyDeliveryOrderRequestMap[A],
): Promise<SyneyDeliveryOrderResponseMap[A]> {
  const proxyUrl = resolveSyneyDeliveryOrderProxyUrl({
    configuredProxyUrl: SYNEY_DELIVERY_ORDER_API_URL,
    isDev: import.meta.env.DEV,
  })

  if (!proxyUrl) {
    throw new Error('未配置西尼送货单代理地址（VITE_SYNEY_DELIVERY_ORDER_API_URL）')
  }

  let response: Response
  try {
    response = await withTimeout(
      fetch(proxyUrl, {
        method: 'POST',
        headers: await getAuthenticatedProxyHeaders(),
        body: JSON.stringify({ action, payload }),
      }),
      DELIVERY_ORDER_STEP_TIMEOUT_MS,
      '西尼 SCM 响应超时，请稍后重试',
    )
  }
  catch (error) {
    if (isBrowserFetchFailure(error)) {
      throw new Error('西尼送货单代理接口连接失败，请检查代理地址或网络', {
        cause: error,
      })
    }
    throw error
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('西尼送货单代理接口未返回 JSON，请检查代理地址配置')
  }

  const data = (await response.json()) as SyneyDeliveryOrderResponseMap[A] & {
    error?: string
  }

  if (!response.ok || data.error) {
    throw new Error(data.error || '西尼送货单代理请求失败')
  }

  return data
}

export function createSyneyDeliveryOrder(poNo: string) {
  return callSyneyDeliveryOrderProxy('create', { poNo })
}

export function planSyneySafeParts(deliveryNo: string, parts: SyneySafePartSourceRow[]) {
  return callSyneyDeliveryOrderProxy('planSafeParts', { deliveryNo, parts })
}

export function addSyneySafePartDetail(item: SyneySafePartDetailPlanItem) {
  return callSyneyDeliveryOrderProxy('addSafePartDetail', { item })
}

export function confirmSyneyDeliveryOrder(deliveryOrderId: number, deliveryNo: string) {
  return callSyneyDeliveryOrderProxy('confirm', { deliveryOrderId, deliveryNo })
}

export async function printSyneyDeliveryOrders(
  deliveryOrderIds: number[],
  deliveryNos: string[],
) {
  const { fileName, contentType, base64 } = await callSyneyDeliveryOrderProxy('print', {
    deliveryOrderIds,
    deliveryNos,
  })

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }

  return { fileName, blob: new Blob([bytes], { type: contentType }) }
}
