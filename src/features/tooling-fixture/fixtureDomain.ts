export const TOOLING_FIXTURE_PUBLIC_QR_PREFIX = '/h5/tooling-fixture/'

export const TOOLING_FIXTURE_STATUSES = ['未使用', '使用中'] as const

export type ToolingFixtureStatus = (typeof TOOLING_FIXTURE_STATUSES)[number]

export const TOOLING_FIXTURE_ACTIONS = ['使用', '归还'] as const

export type ToolingFixtureAction = (typeof TOOLING_FIXTURE_ACTIONS)[number]

export const TOOLING_FIXTURE_LIFECYCLES = ['正常', '维修', '报废'] as const

export type ToolingFixtureLifecycle =
  (typeof TOOLING_FIXTURE_LIFECYCLES)[number]

export function buildToolingFixtureQrPath(qrToken: string): string {
  const normalizedToken = qrToken.trim()

  if (!normalizedToken) {
    throw new Error('工装二维码令牌不能为空')
  }

  return `${TOOLING_FIXTURE_PUBLIC_QR_PREFIX}${encodeURIComponent(normalizedToken)}`
}

export function getToolingFixtureQrValue(qrToken: string): string {
  const path = buildToolingFixtureQrPath(qrToken)

  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
}
