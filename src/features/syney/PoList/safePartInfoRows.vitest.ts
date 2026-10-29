import { describe, expect, it } from 'vitest'

import { filterPosBySafePartCheck } from './safePartInfoRows'

const pos = [
  { poInfo: { No: 'P1' } },
  { poInfo: { No: 'P1' } },
  { poInfo: { No: 'P2' } },
  { poInfo: { No: 'P3' } },
]

describe('filterPosBySafePartCheck', () => {
  it('drops POs that SCM found with no safe-part line', () => {
    const { kept, skippedPoNos } = filterPosBySafePartCheck(pos, [
      { poNo: 'P1', found: true, hasSafeParts: false },
      { poNo: 'P2', found: true, hasSafeParts: true },
      { poNo: 'P3', found: true, hasSafeParts: true },
    ])
    expect(kept.map(po => po.poInfo.No)).toEqual(['P2', 'P3'])
    expect(skippedPoNos).toEqual(['P1'])
  })

  it('keeps POs that SCM could not find', () => {
    const { kept, skippedPoNos } = filterPosBySafePartCheck(pos, [
      { poNo: 'P1', found: false, hasSafeParts: false },
      { poNo: 'P2', found: true, hasSafeParts: false },
      { poNo: 'P3', found: true, hasSafeParts: false },
    ])
    expect(kept.map(po => po.poInfo.No)).toEqual(['P1', 'P1'])
    expect(skippedPoNos).toEqual(['P2', 'P3'])
  })

  it('returns nothing to export when every PO has no safe parts', () => {
    const { kept } = filterPosBySafePartCheck(pos, ['P1', 'P2', 'P3'].map(poNo => ({ poNo, found: true, hasSafeParts: false })))
    expect(kept).toEqual([])
  })
})
