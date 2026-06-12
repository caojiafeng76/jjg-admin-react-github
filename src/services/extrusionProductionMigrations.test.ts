import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

describe('extrusion production migrations', () => {
  function readMigrationSql(): string {
    const migrationsDirectory = resolve('supabase/migrations')
    return readdirSync(migrationsDirectory)
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort()
      .map((fileName) =>
        readFileSync(join(migrationsDirectory, fileName), 'utf8'),
      )
      .join('\n')
  }

  it('allows new records to omit the deprecated operator field', () => {
    const migrationSql = readMigrationSql()

    expect(migrationSql).toMatch(
      /alter table public\.extrusion_productions\s+alter column legacy_operator_name drop not null/i,
    )
  })

  it('allows multiple records for the same production schedule', () => {
    const migrationSql = readMigrationSql()

    expect(migrationSql).toMatch(
      /alter table public\.extrusion_productions\s+drop constraint if exists extrusion_productions_unique_schedule/i,
    )
  })
})
