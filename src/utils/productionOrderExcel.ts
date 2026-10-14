import type { ProductionOrderForExport } from '@/services/apiProductionOrders'

import { buildExcelInWorker, downloadExcelBuffer } from './excelExportWorker'

export async function exportProductionOrdersToExcel(
  orders: ProductionOrderForExport[],
) {
  try {
    const result = await buildExcelInWorker(
      { kind: 'productionOrder', orders },
      '生产工单导出任务启动失败',
    )
    downloadExcelBuffer(result.buffer, result.filename)
    return
  } catch {
    // 回退到主线程导出，避免 Worker 异常时功能不可用。
  }

  // 仅在回退时才在主线程加载 xlsx，避免与 Worker 重复下载
  const { buildProductionOrderExcelBuffer, getProductionOrderExportFilename } =
    await import('./productionOrderExcelWorkbook')
  downloadExcelBuffer(
    buildProductionOrderExcelBuffer(orders),
    getProductionOrderExportFilename(),
  )
}
