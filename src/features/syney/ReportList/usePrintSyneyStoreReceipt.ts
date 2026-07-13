import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { App } from 'antd'

import { fetchSyneyStoreReportFromScm } from '@/services/apiSyneyStoreReports'
import type { SyneyStoreReceiptItem } from '@/utils/syneyStoreReceiptPdf'

const loadStoreReceiptPDF = () => import('@/utils/syneyStoreReceiptPdf')

function renderPreparingWindow(printWindow: Window, storeInNo: string): void {
  printWindow.document.open()
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>正在准备打印 ${storeInNo}</title>
        <style>
          html,
          body {
            height: 100%;
            margin: 0;
            display: grid;
            place-items: center;
            color: #1f2937;
            background: #f8fafc;
            font-family:
              -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .panel {
            padding: 24px 28px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 16px 48px rgb(15 23 42 / 10%);
          }

          .title {
            margin: 0 0 8px;
            font-size: 16px;
            font-weight: 600;
          }

          .hint {
            margin: 0;
            color: #64748b;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <main class="panel">
          <p class="title">正在生成入库单打印内容</p>
          <p class="hint">单号：${storeInNo}</p>
        </main>
      </body>
    </html>
  `)
  printWindow.document.close()
}

export function usePrintSyneyStoreReceipt() {
  const { message } = App.useApp()
  const [isGenerating, setIsGenerating] = useState(false)
  const { mutateAsync: fetchStoreReport, isPending: isFetching } = useMutation({
    mutationFn: fetchSyneyStoreReportFromScm,
  })

  function preloadStoreReceiptPDF() {
    void loadStoreReceiptPDF()
  }

  async function printByStoreInNo(storeInNo: string): Promise<boolean> {
    const trimmedStoreInNo = storeInNo.trim()

    if (!trimmedStoreInNo) {
      message.warning('请输入入库单号')
      return false
    }

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      renderPreparingWindow(printWindow, trimmedStoreInNo)
    } else {
      message.warning('浏览器阻止了打印窗口，请允许弹窗后重试')
    }

    try {
      setIsGenerating(true)
      const items = (await fetchStoreReport(
        trimmedStoreInNo,
      )) as SyneyStoreReceiptItem[]

      if (items.length === 0) {
        printWindow?.close()
        message.warning('未获取到该入库单数据')
        return false
      }

      const { buildSyneyStoreReceiptReport, printSyneyStoreReceipt } =
        await loadStoreReceiptPDF()
      const report = buildSyneyStoreReceiptReport(items)
      const printed = await printSyneyStoreReceipt(report, printWindow)

      if (printed) {
        message.success('已打开浏览器打印窗口')
      } else {
        message.warning('浏览器阻止了直接打印，已回退为 PDF 预览')
      }

      return printed
    } catch (error) {
      printWindow?.close()
      console.error('打印西尼入库单失败:', error)
      message.error(error instanceof Error ? error.message : '打印入库单失败')
      return false
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    printByStoreInNo,
    preloadStoreReceiptPDF,
    isPrintingStoreReceipt: isFetching || isGenerating,
  }
}
