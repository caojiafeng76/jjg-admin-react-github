export const LABOR_PROTECTION_PUBLIC_QR_PATH =
  '/h5/labor-protection-requisition'

export function getLaborProtectionPublicQrPath() {
  return LABOR_PROTECTION_PUBLIC_QR_PATH
}

export function getLaborProtectionPublicQrValue() {
  if (typeof window === 'undefined') {
    return LABOR_PROTECTION_PUBLIC_QR_PATH
  }

  return `${window.location.origin}${LABOR_PROTECTION_PUBLIC_QR_PATH}`
}
