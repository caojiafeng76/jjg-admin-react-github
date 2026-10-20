/// <reference lib="webworker" />

import type {
  ExcelExportWorkerRequest,
  ExcelExportWorkerResponse,
} from './excelExportWorker'
import {
  buildProductionDailyReportExcelBuffer,
  getProductionDailyReportExportFilename,
} from './productionDailyReportExcelWorkbook'
import {
  buildProductionOrderExcelBuffer,
  getProductionOrderExportFilename,
} from './productionOrderExcelWorkbook'

// 所有 Excel 导出共用一个 Worker，xlsx-js-style 只打包一份
function buildExcel(request: ExcelExportWorkerRequest) {
  switch (request.kind) {
    case 'productionOrder':
      return {
        buffer: buildProductionOrderExcelBuffer(request.orders),
        filename: getProductionOrderExportFilename(),
      }
    case 'productionDailyReport':
      return {
        buffer: buildProductionDailyReportExcelBuffer(request.rows),
        filename: getProductionDailyReportExportFilename(),
      }
  }
}

self.onmessage = (event: MessageEvent<ExcelExportWorkerRequest>) => {
  try {
    const { buffer, filename } = buildExcel(event.data)
    const response: ExcelExportWorkerResponse = { buffer, filename }

    self.postMessage(response, [buffer])
  }
  catch (error) {
    const response: ExcelExportWorkerResponse = {
      error: error instanceof Error ? error.message : 'Excel 导出失败',
    }

    self.postMessage(response)
  }
}

export {}
