import { existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nestedDir = path.join(
  root,
  'node_modules',
  'typescript',
  'node_modules',
  '@typescript',
  'old',
)
const nestedPkgFile = path.join(nestedDir, 'package.json')

if (existsSync(nestedPkgFile)) {
  const nestedPkg = JSON.parse(readFileSync(nestedPkgFile, 'utf8'))
  if (nestedPkg.name !== 'typescript') {
    rmSync(nestedDir, { recursive: true, force: true })
    console.log(
      '[fix-typescript6-alias] removed incorrect nested @typescript/old shim',
    )
  }
}
