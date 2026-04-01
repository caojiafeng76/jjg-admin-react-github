/// <reference lib="webworker" />

import type { ProductionOrderForExport } from '@/services/apiProductionOrders'

import {
  buildProductionOrderExcelBuffer,
  getProductionOrderExportFilename,
} from './productionOrderExcelWorkbook'

type ProductionOrderExcelWorkerMessage = {
  orders: ProductionOrderForExport[]
}

self.onmessage = (event: MessageEvent<ProductionOrderExcelWorkerMessage>) => {
  try {
    const buffer = buildProductionOrderExcelBuffer(event.data.orders)
    const filename = getProductionOrderExportFilename()

    self.postMessage({ buffer, filename }, [buffer])
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : '生产工单导出失败',
    })
  }
}

export {}