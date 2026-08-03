import { describe, expect, it } from 'vitest'

import {
  buildToolingFixtureQrPath,
  getToolingFixtureQrValue,
} from './fixtureDomain'

describe('tooling fixture domain', () => {
  it('builds a QR path from the unique fixture token', () => {
    expect(buildToolingFixtureQrPath('fixture-token-001')).toBe(
      '/h5/tooling-fixture/fixture-token-001',
    )
  })

  it('builds a full QR value from the unique fixture token', () => {
    const value = getToolingFixtureQrValue('fixture-token-001')

    expect(value).toContain('/h5/tooling-fixture/fixture-token-001')
    expect(value).toMatch(/^https?:\/\/.+/)
  })

  it('rejects an empty fixture token', () => {
    expect(() => buildToolingFixtureQrPath('  ')).toThrow('工装二维码令牌不能为空')
  })
})
