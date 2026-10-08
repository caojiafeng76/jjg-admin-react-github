export const JINTAN_PARTS_STOCK_OUT_PUBLIC_QR_PATH =
  '/h5/jintan-parts-stock-out'

export function getJintanPartsStockOutPublicQrPath() {
  return JINTAN_PARTS_STOCK_OUT_PUBLIC_QR_PATH
}

export function getJintanPartsStockOutPublicQrValue() {
  if (typeof window === 'undefined') {
    return JINTAN_PARTS_STOCK_OUT_PUBLIC_QR_PATH
  }

  return `${window.location.origin}${JINTAN_PARTS_STOCK_OUT_PUBLIC_QR_PATH}`
}
