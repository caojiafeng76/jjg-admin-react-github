import { readdirSync, readFileSync } from 'node:fs'
import { extname, relative, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const SOURCE_ROOT = resolve(process.cwd(), 'src')
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx'])
const ZERO_ARGUMENT_STORE_CALL = new RegExp(
  ['\\buseAppStore', '\\s*\\(', '\\s*\\)'].join(''),
  'g',
)

function getProductionSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      return getProductionSourceFiles(path)
    }

    if (
      !SOURCE_EXTENSIONS.has(extname(entry.name)) ||
      entry.name.includes('.test.') ||
      entry.name.includes('.vitest.')
    ) {
      return []
    }

    return [path]
  })
}

describe('useAppStore subscription contract', () => {
  it('subscribes through field selectors instead of the entire store', () => {
    const offenders = getProductionSourceFiles(SOURCE_ROOT).flatMap((path) => {
      const source = readFileSync(path, 'utf8')

      return [...source.matchAll(ZERO_ARGUMENT_STORE_CALL)].map((match) => ({
        file: relative(process.cwd(), path),
        line: source.slice(0, match.index).split('\n').length,
      }))
    })

    expect(offenders).toEqual([])
  })
})
