import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'
import type { ProductionOrderForExport } from '@/services/apiProductionOrders'

export type ExcelExportWorkerRequest =
  | { kind: 'productionOrder'; orders: ProductionOrderForExport[] }
  | { kind: 'productionDailyReport'; rows: ProductionDailyReportRow[] }

export type ExcelExportWorkerResult = {
  buffer: ArrayBuffer
  filename: string
}

export type ExcelExportWorkerResponse =
  ExcelExportWorkerResult | { error: string }

export function downloadExcelBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}

/**
 * 在共享的 Excel Worker 中生成工作簿；环境不支持 Worker 或 Worker 失败时 reject，
 * 由调用方回退到主线程生成。
 */
export function buildExcelInWorker(
  request: ExcelExportWorkerRequest,
  startErrorMessage: string,
) {
  return new Promise<ExcelExportWorkerResult>((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('当前环境不支持 Worker'))
      return
    }

    const worker = new Worker(
      new URL('./excelExport.worker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (event: MessageEvent<ExcelExportWorkerResponse>) => {
      worker.terminate()

      if ('error' in event.data) {
        reject(new Error(event.data.error))
        return
      }

      resolve(event.data)
    }

    worker.onerror = () => {
      worker.terminate()
      reject(new Error(startErrorMessage))
    }

    worker.postMessage(request)
  })
}
