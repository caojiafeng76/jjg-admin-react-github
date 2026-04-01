import type { ProductionOrderForExport } from '@/services/apiProductionOrders'

import {
  buildProductionOrderExcelBuffer,
  getProductionOrderExportFilename,
} from './productionOrderExcelWorkbook'

type ProductionOrderExcelWorkerSuccess = {
  buffer: ArrayBuffer
  filename: string
}

type ProductionOrderExcelWorkerFailure = {
  error: string
}

function downloadProductionOrderExcel(buffer: ArrayBuffer, filename: string) {
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

function buildProductionOrderExcelInWorker(orders: ProductionOrderForExport[]) {
  return new Promise<ProductionOrderExcelWorkerSuccess>((resolve, reject) => {
    const worker = new Worker(
      new URL('./productionOrderExcel.worker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (
      event: MessageEvent<
        ProductionOrderExcelWorkerSuccess | ProductionOrderExcelWorkerFailure
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
      reject(new Error('生产工单导出任务启动失败'))
    }

    worker.postMessage({ orders })
  })
}

export async function exportProductionOrdersToExcel(
  orders: ProductionOrderForExport[],
) {
  const filename = getProductionOrderExportFilename()

  if (typeof Worker !== 'undefined') {
    try {
      const result = await buildProductionOrderExcelInWorker(orders)
      downloadProductionOrderExcel(result.buffer, result.filename)
      return
    } catch {
      // 回退到主线程导出，避免 Worker 异常时功能不可用。
    }
  }

  const buffer = buildProductionOrderExcelBuffer(orders)
  downloadProductionOrderExcel(buffer, filename)
}