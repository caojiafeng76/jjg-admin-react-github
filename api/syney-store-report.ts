import { fetchSyneyStoreReportFromServer } from '../syneyStoreReportServer'

type VercelRequest = {
  method?: string
  body?: {
    storeInNo?: unknown
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
    const storeInNo =
      typeof request.body?.storeInNo === 'string'
        ? request.body.storeInNo.trim()
        : ''

    if (!storeInNo) {
      response.status(400).json({ error: '请输入入库单号' })
      return
    }

    const items = await fetchSyneyStoreReportFromServer(process.env, storeInNo)

    response.status(200).json({
      storeInNo,
      total: Array.isArray(items) ? items.length : 0,
      items,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '西尼入库单获取失败'
    response.status(500).json({ error: message })
  }
}
