import { describe, expect, it } from 'vitest'

import {
  buildToolingOptionKeywords,
  matchesToolingOptionKeyword,
} from './toolingOptionSearch'

describe('tooling option search', () => {
  it('matches Chinese tooling fields by pinyin initials', () => {
    const keywords = buildToolingOptionKeywords([
      'T-001',
      '车刀片',
      '合金钻头',
      '硬质合金',
    ])

    expect(matchesToolingOptionKeyword('cdp', keywords)).toBe(true)
    expect(matchesToolingOptionKeyword('hj', keywords)).toBe(true)
    expect(matchesToolingOptionKeyword('yz', keywords)).toBe(true)
  })

  it('keeps existing contains matching for codes and specs', () => {
    const keywords = buildToolingOptionKeywords([
      'T-ABC-001',
      '车刀片',
      'D12*80',
      'HSS',
    ])

    expect(matchesToolingOptionKeyword('abc', keywords)).toBe(true)
    expect(matchesToolingOptionKeyword('12*8', keywords)).toBe(true)
    expect(matchesToolingOptionKeyword('hss', keywords)).toBe(true)
  })
})
