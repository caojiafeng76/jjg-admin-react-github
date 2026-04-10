export function getWorkshopOrderQrPath(orderId: string) {
  return `/workshop-order-list/qr/${orderId}`
}

export function getWorkshopOrderQrValue(orderId: string) {
  if (typeof window === 'undefined') {
    return getWorkshopOrderQrPath(orderId)
  }

  return `${window.location.origin}${getWorkshopOrderQrPath(orderId)}`
}