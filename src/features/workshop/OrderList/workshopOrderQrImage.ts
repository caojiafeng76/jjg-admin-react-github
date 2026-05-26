import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import QRCodeImport from 'react-qr-code'

import { getWorkshopOrderQrValue } from './workshopOrderQr'

const QRCodeComponent = (
  QRCodeImport as typeof QRCodeImport & {
    default?: typeof QRCodeImport
  }
).default
  ? (
      QRCodeImport as typeof QRCodeImport & {
        default: typeof QRCodeImport
      }
    ).default
  : QRCodeImport

const QR_IMAGE_SIZE = 128
const qrImageCache = new Map<string, Promise<string>>()

async function svgMarkupToPngDataUrl(svgMarkup: string) {
  const svgBlob = new Blob([svgMarkup], {
    type: 'image/svg+xml;charset=utf-8',
  })
  const objectUrl = URL.createObjectURL(svgBlob)

  try {
    return await new Promise<string>((resolve, reject) => {
      const image = new Image()

      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = QR_IMAGE_SIZE
        canvas.height = QR_IMAGE_SIZE

        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('二维码画布初始化失败'))
          return
        }

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, QR_IMAGE_SIZE, QR_IMAGE_SIZE)
        context.drawImage(image, 0, 0, QR_IMAGE_SIZE, QR_IMAGE_SIZE)
        resolve(canvas.toDataURL('image/png'))
      }

      image.onerror = () => {
        reject(new Error('二维码图片生成失败'))
      }

      image.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function getWorkshopOrderQrPngDataUrl(orderId: string) {
  const cachedImage = qrImageCache.get(orderId)
  if (cachedImage) {
    return cachedImage
  }

  const qrValue = getWorkshopOrderQrValue(orderId)
  const svgMarkup = renderToStaticMarkup(
    createElement(QRCodeComponent, {
      value: qrValue,
      size: QR_IMAGE_SIZE,
      bgColor: '#FFFFFF',
      fgColor: '#000000',
      level: 'M',
    }),
  )

  const qrImagePromise = svgMarkupToPngDataUrl(svgMarkup)
  qrImageCache.set(orderId, qrImagePromise)

  return qrImagePromise
}

export async function getWorkshopOrderQrPngData(orderId: string) {
  const qrImage = await getWorkshopOrderQrPngDataUrl(orderId)
  const response = await fetch(qrImage)

  return response.arrayBuffer()
}
