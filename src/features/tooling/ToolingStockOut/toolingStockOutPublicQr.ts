export const TOOLING_STOCK_OUT_PUBLIC_QR_PATH = '/h5/tooling-stock-out'

export function getToolingStockOutPublicQrPath() {
  return TOOLING_STOCK_OUT_PUBLIC_QR_PATH
}

export function getToolingStockOutPublicQrValue() {
  if (typeof window === 'undefined') {
    return TOOLING_STOCK_OUT_PUBLIC_QR_PATH
  }

  return `${window.location.origin}${TOOLING_STOCK_OUT_PUBLIC_QR_PATH}`
}
