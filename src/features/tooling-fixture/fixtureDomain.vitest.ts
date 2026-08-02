import { describe, expect, it } from 'vitest'

import { buildToolingFixtureQrPath } from './fixtureDomain'

describe('tooling fixture domain', () => {
  it('builds a QR path from the unique fixture token', () => {
    expect(buildToolingFixtureQrPath('fixture-token-001')).toBe(
      '/h5/tooling-fixture/fixture-token-001',
    )
  })
})
