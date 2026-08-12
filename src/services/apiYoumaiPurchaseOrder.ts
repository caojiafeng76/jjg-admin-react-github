import type { YoumaiFinishedGoodsStockOutImportRow } from './apiYoumaiFinishedGoodsStockOut'
import { getAuthenticatedProxyHeaders } from './proxyAuth'
import supabase from './supabase'
import {
  extractFunctionInvokeErrorMessage,
  getFunctionRegion,
  withTimeout,
} from './functionInvokeHelpers'

const FETCH_YOUMAI_PURCHASE_ORDER_TIMEOUT_MS = 45000
const YOUMAI_PURCHASE_ORDER_API_URL = import.meta.env
  .VITE_YOUMAI_PURCHASE_ORDER_API_URL as string | undefined
const YOUMAI_PURCHASE_ORDER_FUNCTION_REGION = import.meta.env
  .VITE_SUPABASE_FUNCTION_REGION as string | undefined

async function invokeYoumaiPurchaseOrderFunction(purchaseOrderNo: string) {
  const region = getFunctionRegion(YOUMAI_PURCHASE_ORDER_FUNCTION_REGION)

  const { data, error } = await withTimeout(
    supabase.functions.invoke<{
      purchaseOrderNo: string
      total: number
      items: YoumaiFinishedGoodsStockOutImportRow[]
      error?: string
    }>('fetch-youmai-purchase-order', {
      body: { purchaseOrderNo },
      ...(region ? { region } : {}),
    }),
    FETCH_YOUMAI_PURCHASE_ORDER_TIMEOUT_MS,
    '优迈采购订单获取超时，请稍后重试',
  )

  if (error) {
    const functionErrorMessage = await extractFunctionInvokeErrorMessage(error)
    if (functionErrorMessage) {
      throw new Error(functionErrorMessage)
    }

    throw new Error('优迈采购订单获取失败')
  }

  if (!data) {
    throw new Error('优迈采购订单获取失败')
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data.items || []
}

async function fetchYoumaiPurchaseOrderFromProxy(
  proxyUrl: string,
  purchaseOrderNo: string,
) {
  const response = await withTimeout(
    fetch(proxyUrl, {
      method: 'POST',
      headers: await getAuthenticatedProxyHeaders(),
      body: JSON.stringify({ purchaseOrderNo }),
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

export async function fetchYoumaiPurchaseOrder(purchaseOrderNo: string) {
  const normalizedPurchaseOrderNo = purchaseOrderNo.trim()

  if (!normalizedPurchaseOrderNo) {
    throw new Error('请输入采购订单号')
  }

  const configuredProxyUrl = YOUMAI_PURCHASE_ORDER_API_URL?.trim()
  const proxyUrl =
    configuredProxyUrl ||
    (import.meta.env.DEV ? '/api/youmai-purchase-order' : '')

  if (!proxyUrl) {
    return invokeYoumaiPurchaseOrderFunction(normalizedPurchaseOrderNo)
  }

  return fetchYoumaiPurchaseOrderFromProxy(proxyUrl, normalizedPurchaseOrderNo)
}
