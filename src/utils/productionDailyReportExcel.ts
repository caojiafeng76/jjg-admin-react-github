import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'

import { buildExcelInWorker, downloadExcelBuffer } from './excelExportWorker'

async function waitForNextPaint() {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}

export async function exportProductionDailyReportToExcel(
  rows: ProductionDailyReportRow[],
) {
  await waitForNextPaint()

  try {
    const result = await buildExcelInWorker(
      { kind: 'productionDailyReport', rows },
      '生产日报表导出任务启动失败',
    )
    downloadExcelBuffer(result.buffer, result.filename)
    return
  } catch {
    // Worker 异常时回退主线程导出，保证功能可用。
  }

  // 仅在回退时才在主线程加载 xlsx，避免与 Worker 重复下载
  const {
    buildProductionDailyReportExcelBuffer,
    getProductionDailyReportExportFilename,
  } = await import('./productionDailyReportExcelWorkbook')
  downloadExcelBuffer(
    buildProductionDailyReportExcelBuffer(rows),
    getProductionDailyReportExportFilename(),
  )
}
