import { describe, expect, it } from 'vitest'

import { TOOLING_PERMISSIONS } from './permissions'

describe('tooling fixture permissions', () => {
  it('registers independent fixture navigation and pages', () => {
    expect(TOOLING_PERMISSIONS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'nav:tooling-fixture' }),
        expect.objectContaining({ key: 'page:fixture-data' }),
        expect.objectContaining({ key: 'page:fixture-records' }),
      ]),
    )
  })
})
