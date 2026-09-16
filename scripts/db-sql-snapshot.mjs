import { mkdtempSync, writeFileSync, rmSync, rmdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export function withSqlSnapshot(sql, execute) {
  const directory = mkdtempSync(join(tmpdir(), 'jjg-checked-sql-'))
  const file = join(directory, 'query.sql')
  try {
    writeFileSync(file, sql, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
    return execute(file)
  } finally {
    try {
      rmSync(file, { force: true })
    } finally {
      rmdirSync(directory)
    }
  }
}
