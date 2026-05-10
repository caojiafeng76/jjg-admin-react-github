import type { YoumaiFinishedGoodsStockOutImportRow } from './apiYoumaiFinishedGoodsStockOut'

const FETCH_YOUMAI_PURCHASE_ORDER_TIMEOUT_MS = 45000
const YOUMAI_PURCHASE_ORDER_API_URL = import.meta.env
  .VITE_YOUMAI_PURCHASE_ORDER_API_URL as string | undefined

async function withTimeout<T>(
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

export async function fetchYoumaiPurchaseOrder(purchaseOrderNo: string) {
  const normalizedPurchaseOrderNo = purchaseOrderNo.trim()

  if (!normalizedPurchaseOrderNo) {
    throw new Error('请输入采购订单号')
  }

  const configuredProxyUrl = YOUMAI_PURCHASE_ORDER_API_URL?.trim()
  const proxyUrl = configuredProxyUrl || '/api/youmai-purchase-order'

  const response = await withTimeout(
    fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purchaseOrderNo: normalizedPurchaseOrderNo }),
    }),
    FETCH_YOUMAI_PURCHASE_ORDER_TIMEOUT_MS,
    '优迈采购订单获取超时，请稍后重试',
  )

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('优迈采购订单代理接口未返回 JSON，请检查代理地址配置')
  }

  const data = (await response.json()) as {
    items?: YoumaiFinishedGoodsStockOutImportRow[]
    error?: string
  }

  if (!response.ok || data.error) {
    throw new Error(data.error || '优迈采购订单获取失败')
  }

  return data.items || []
}
