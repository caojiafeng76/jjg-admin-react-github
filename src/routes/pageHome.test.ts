import { describe, expect, it } from 'vitest'

import { deriveDefaultHome, userCanAccessPath } from './pageHome'

describe('pageHome', () => {
  it('falls back to the first permitted page when the role default is denied', () => {
    expect(
      deriveDefaultHome('admin', {
        'page:dashboard': false,
        'page:syney-spec-list': true,
      }),
    ).toBe('/syney-spec-list')
  })

  it('rejects an explicitly protected redirect path without its permission', () => {
    expect(
      userCanAccessPath('/production-order', {
        'page:production-order': false,
      }),
    ).toBe(false)
  })
})
