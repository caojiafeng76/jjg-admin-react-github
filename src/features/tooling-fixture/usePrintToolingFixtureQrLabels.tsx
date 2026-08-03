import { useState } from 'react'
import { App } from 'antd'
import { renderToStaticMarkup } from 'react-dom/server'

import AppQRCode from '@ui/AppQRCode'
import type { ToolingFixture } from '@/services/apiToolingFixture'
import { getToolingFixtureQrValue } from './fixtureDomain'

const LABELS_PER_PAGE = 10

const labelFont =
  "'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif"

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function buildToolingFixtureQrLabelsHtml(items: ToolingFixture[]) {
  const pages: string[] = []

  for (let index = 0; index < items.length; index += LABELS_PER_PAGE) {
    const pageItems = items.slice(index, index + LABELS_PER_PAGE)
    const labelsMarkup = pageItems
      .map((item) => {
        const qrValue = getToolingFixtureQrValue(item.qr_token)
        const qrMarkup = renderToStaticMarkup(
          <AppQRCode
            value={qrValue}
            size={320}
            bgColor="#FFFFFF"
            fgColor="#111111"
            level="M"
            style={{ height: '100%', width: '100%' }}
          />,
        )
        const safeFixtureNo = escapeHtml(String(item.fixture_no ?? ''))
        const safeProductName = escapeHtml(String(item.product_name ?? ''))

        return `
          <div class="label">
            <div class="qr">${qrMarkup}</div>
            <div class="no" title="${safeFixtureNo}">${safeFixtureNo}</div>
            <div class="name" title="${safeProductName}">${safeProductName}</div>
          </div>
        `
      })
      .join('')

    pages.push(`<div class="page">${labelsMarkup}</div>`)
  }

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>工装模具二维码</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }

          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          body {
            font-family: ${labelFont};
            color: #0f172a;
          }

          .page {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 53mm;
            gap: 4mm;
            break-after: page;
            page-break-after: always;
          }

          .page:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .label {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1.5mm;
            padding: 2mm;
            border: 0.6px dashed #94a3b8;
            overflow: hidden;
          }

          .qr {
            width: 34mm;
            height: 34mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr svg {
            width: 100%;
            height: 100%;
          }

          .no,
          .name {
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .no {
            font-size: 5mm;
            font-weight: 700;
            line-height: 1.2;
          }

          .name {
            font-size: 4mm;
            line-height: 1.2;
            color: #334155;
          }
        </style>
      </head>
      <body>
        ${pages.join('')}

        <script>
          window.onload = function () {
            window.focus();
            setTimeout(function () {
              window.print();
            }, 240);
          };

          window.onafterprint = function () {
            setTimeout(function () {
              window.close();
            }, 120);
          };
        </script>
      </body>
    </html>
  `
}

export function usePrintToolingFixtureQrLabels() {
  const { message } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  async function printLabels(items: ToolingFixture[]) {
    try {
      if (items.length === 0) {
        message.warning('请先选择要打印的工装')
        return false
      }

      setIsPrinting(true)

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        message.warning('浏览器阻止了打印窗口，请允许弹窗后重试')
        return false
      }

      printWindow.document.open()
      printWindow.document.write(buildToolingFixtureQrLabelsHtml(items))
      printWindow.document.close()
      message.success(`已打开打印窗口，共 ${items.length} 个二维码标签`)

      return true
    } catch (error) {
      console.error('打印工装二维码标签失败:', error)
      message.error(
        error instanceof Error ? error.message : '打印失败，请稍后重试',
      )
      return false
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    printLabels,
    isPrinting,
  }
}
