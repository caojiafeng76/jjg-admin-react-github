/// <reference lib="webworker" />

import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'

import {
  buildProductionDailyReportExcelBuffer,
  getProductionDailyReportExportFilename,
} from './productionDailyReportExcelWorkbook'

type ProductionDailyReportExcelWorkerMessage = {
  rows: ProductionDailyReportRow[]
}

self.onmessage = (
  event: MessageEvent<ProductionDailyReportExcelWorkerMessage>,
) => {
  try {
    const buffer = buildProductionDailyReportExcelBuffer(event.data.rows)
    const filename = getProductionDailyReportExportFilename()

    self.postMessage({ buffer, filename }, [buffer])
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : '生产日报表导出失败',
    })
  }
}

export {}