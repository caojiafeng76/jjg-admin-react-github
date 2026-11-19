import { describe, expect, it } from 'vitest'

import { SUMMARY_ROW_CLASS_NAME, zebraRowClassName } from './tableStyles'

describe('tableStyles', () => {
  it('returns dark-mode compatible zebra classes for even and odd rows', () => {
    const even = zebraRowClassName({}, 0)
    const odd = zebraRowClassName({}, 1)

    expect(even).toContain('bg-white')
    expect(even).toContain('dark:bg-slate-800')
    expect(odd).toContain('bg-slate-50/70')
    expect(odd).toContain('dark:bg-slate-800/50')
    expect(even).not.toBe(odd)
  })

  it('exports a dark-mode readable summary row class', () => {
    expect(SUMMARY_ROW_CLASS_NAME).toContain('bg-slate-50')
    expect(SUMMARY_ROW_CLASS_NAME).toContain('dark:bg-slate-800/80')
    expect(SUMMARY_ROW_CLASS_NAME).not.toContain('!bg-slate-50')
  })
})
