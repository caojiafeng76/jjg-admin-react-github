export const SYNEY_STORE_REPORT_DEV_PROXY_URL = '/api/syney-store-report'

export function resolveSyneyStoreReportProxyUrl({
  configuredProxyUrl,
  isDev,
}: {
  configuredProxyUrl?: string
  isDev: boolean
}): string {
  if (isDev) {
    return SYNEY_STORE_REPORT_DEV_PROXY_URL
  }

  return configuredProxyUrl?.trim() || ''
}
