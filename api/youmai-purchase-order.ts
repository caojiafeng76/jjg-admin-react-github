import { fetchYoumaiPurchaseOrderFromServer } from '../youmaiPurchaseOrderServer'

type VercelRequest = {
  method?: string
  body?: {
    purchaseOrderNo?: unknown
  }
}

type VercelResponse = {
  status: (statusCode: number) => {
    json: (body: Record<string, unknown>) => void
  }
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const purchaseOrderNo =
      typeof request.body?.purchaseOrderNo === 'string'
        ? request.body.purchaseOrderNo.trim()
        : ''

    if (!purchaseOrderNo) {
      response.status(400).json({ error: '请输入采购订单号' })
      return
    }

    const items = await fetchYoumaiPurchaseOrderFromServer(
      process.env,
      purchaseOrderNo,
    )

    response.status(200).json({
      purchaseOrderNo,
      total: items.length,
      items,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '优迈采购订单获取失败'
    response.status(500).json({ error: message })
  }
}
