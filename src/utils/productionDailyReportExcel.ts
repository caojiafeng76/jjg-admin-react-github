import type { ProductionDailyReportRow } from '@/services/apiProductionDailyReport'
import {
  buildProductionDailyReportExcelBuffer,
  getProductionDailyReportExportFilename,
} from './productionDailyReportExcelWorkbook'

type ProductionDailyReportExcelWorkerSuccess = {
  buffer: ArrayBuffer
  filename: string
}

type ProductionDailyReportExcelWorkerFailure = {
  error: string
}

function downloadProductionDailyReportExcel(
  buffer: ArrayBuffer,
  filename: string,
) {
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

function buildProductionDailyReportExcelInWorker(
  rows: ProductionDailyReportRow[],
) {
  return new Promise<ProductionDailyReportExcelWorkerSuccess>(
    (resolve, reject) => {
      const worker = new Worker(
        new URL('./productionDailyReportExcel.worker.ts', import.meta.url),
        { type: 'module' },
      )

      worker.onmessage = (
        event: MessageEvent<
          | ProductionDailyReportExcelWorkerSuccess
          | ProductionDailyReportExcelWorkerFailure
        >,
      ) => {
        worker.terminate()

        if ('error' in event.data) {
          reject(new Error(event.data.error))
          return
        }

        resolve(event.data)
      }

      worker.onerror = () => {
        worker.terminate()
        reject(new Error('生产日报表导出任务启动失败'))
      }

      worker.postMessage({ rows })
    },
  )
}

async function waitForNextPaint() {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve())
  })
}

export async function exportProductionDailyReportToExcel(
  rows: ProductionDailyReportRow[],
) {
  const filename = getProductionDailyReportExportFilename()

  await waitForNextPaint()

  if (typeof Worker !== 'undefined') {
    try {
      const result = await buildProductionDailyReportExcelInWorker(rows)
      downloadProductionDailyReportExcel(result.buffer, result.filename)
      return
    } catch {
      // Worker 异常时回退主线程导出，保证功能可用。
    }
  }

  const buffer = buildProductionDailyReportExcelBuffer(rows)
  downloadProductionDailyReportExcel(buffer, filename)
}
