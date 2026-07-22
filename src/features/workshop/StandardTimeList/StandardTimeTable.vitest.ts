import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('standard time table scrolling', () => {
  it('keeps the horizontal scrollbar visible inside the table viewport', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/features/workshop/StandardTimeList/StandardTimeTable.tsx',
      ),
      'utf8',
    )

    expect(source).toContain('sticky={{ offsetScroll: 0 }}')
  })
})
