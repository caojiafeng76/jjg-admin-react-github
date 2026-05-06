import { useState } from 'react'
import { App } from 'antd'
import { format } from 'date-fns'
import { renderToStaticMarkup } from 'react-dom/server'

import AppQRCode from '@ui/AppQRCode'
import {
  getToolingStockOutPublicQrPath,
  getToolingStockOutPublicQrValue,
} from './toolingStockOutPublicQr'

const posterTitleFont = "'STSong', 'SimSun', 'Noto Serif SC', serif"
const posterBodyFont =
  "'Microsoft YaHei', 'PingFang SC', 'Noto Sans SC', sans-serif"

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildPosterHtml({
  qrMarkup,
  qrPath,
  qrValue,
  printTime,
}: {
  qrMarkup: string
  qrPath: string
  qrValue: string
  printTime: string
}) {
  const safeQrPath = escapeHtml(qrPath)
  const safeQrValue = escapeHtml(qrValue)
  const safePrintTime = escapeHtml(printTime)

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>刀具出库二维码</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }

          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #e7edf1;
          }

          body {
            display: flex;
            justify-content: center;
            font-family: ${posterBodyFont};
            color: #0f172a;
          }

          .poster {
            position: relative;
            width: 210mm;
            min-height: 297mm;
            padding: 18mm 16mm 14mm;
            display: flex;
            flex-direction: column;
            gap: 12mm;
            background:
              radial-gradient(circle at top, rgba(14, 165, 233, 0.14), transparent 24%),
              linear-gradient(180deg, #f8fbfc 0%, #edf4f6 100%);
            overflow: hidden;
          }

          .poster::before {
            content: '';
            position: absolute;
            inset: 10mm;
            border: 1px solid rgba(15, 23, 42, 0.1);
            pointer-events: none;
          }

          .headline {
            margin-top: 4mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8mm;
            text-align: center;
          }

          .headline-title,
          .headline-subtitle {
            margin: 0;
            font-family: ${posterTitleFont};
            font-weight: 500;
            color: #020617;
          }

          .headline-title {
            font-size: 22mm;
            line-height: 1;
            letter-spacing: 1mm;
          }

          .headline-subtitle {
            font-size: 18mm;
            line-height: 1.08;
            letter-spacing: 1.2mm;
          }

          .qr-shell {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 5mm;
            padding: 0 8mm 2mm;
          }

          .qr-frame {
            width: 100%;
            max-width: 150mm;
            min-height: 145mm;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18mm 14mm;
            border: 1.4px solid #0f172a;
            background: rgba(255, 255, 255, 0.96);
          }

          .qr-card {
            width: 86mm;
            height: 86mm;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr-card svg {
            width: 100%;
            height: 100%;
          }

          .hint {
            margin: 0;
            font-size: 5.2mm;
            letter-spacing: 0.4mm;
            color: #475569;
          }

          .note {
            margin-top: auto;
            padding-top: 6mm;
            border-top: 1px solid rgba(15, 23, 42, 0.12);
            display: flex;
            flex-direction: column;
            gap: 2mm;
            color: #475569;
          }

          .note-label {
            font-size: 3.4mm;
            font-weight: 700;
            letter-spacing: 0.8mm;
            text-transform: uppercase;
            color: #64748b;
          }

          .note-text {
            margin: 0;
            font-size: 4mm;
            line-height: 1.6;
          }

          .note-link {
            font-size: 3.4mm;
            line-height: 1.6;
            word-break: break-all;
            color: #111827;
          }

          .print-time {
            text-align: right;
            font-size: 3.2mm;
            color: #64748b;
          }

          @media screen {
            body { padding: 24px 0; }
            .poster { box-shadow: 0 30px 80px rgba(15, 23, 42, 0.16); }
          }
        </style>
      </head>
      <body>
        <main class="poster">
          <header class="headline">
            <h1 class="headline-title">刀具出库</h1>
            <h2 class="headline-subtitle">请先扫码登记</h2>
          </header>

          <section class="qr-shell">
            <div class="qr-frame">
              <div class="qr-card">${qrMarkup}</div>
            </div>
            <p class="hint">微信扫一扫，填写刀具、领用人、用途和数量后提交</p>
          </section>

          <footer class="note">
            <div class="note-label">Scan Entry</div>
            <p class="note-text">扫码后将直接打开刀具出库登记 H5 页面，无需登录。</p>
            <div class="note-link">页面路径：${safeQrPath}</div>
            <div class="note-link">完整链接：${safeQrValue}</div>
            <div class="print-time">打印时间：${safePrintTime}</div>
          </footer>
        </main>

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

export function usePrintToolingStockOutPublicQrPoster() {
  const { message } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  async function printPoster() {
    try {
      setIsPrinting(true)

      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        message.warning('浏览器阻止了打印窗口，请允许弹窗后重试')
        return false
      }

      const qrPath = getToolingStockOutPublicQrPath()
      const qrValue = getToolingStockOutPublicQrValue()
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

      printWindow.document.open()
      printWindow.document.write(
        buildPosterHtml({
          qrMarkup,
          qrPath,
          qrValue,
          printTime: format(new Date(), 'yyyy-MM-dd HH:mm'),
        }),
      )
      printWindow.document.close()
      message.success('已打开二维码打印窗口')

      return true
    } catch (error) {
      console.error('打印刀具出库二维码海报失败:', error)
      message.error(
        error instanceof Error ? error.message : '打印失败，请稍后重试',
      )
      return false
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    printPoster,
    isPrinting,
  }
}
