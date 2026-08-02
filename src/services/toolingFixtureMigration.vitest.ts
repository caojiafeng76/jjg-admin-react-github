import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260802090000_create_tooling_fixtures.sql',
)

describe('tooling fixture migration contract', () => {
  it('defines the fixture and usage record tables', () => {
    expect(existsSync(migrationPath)).toBe(true)

    const migration = readFileSync(migrationPath, 'utf8')

    expect(migration).toContain(
      'create table if not exists public.tooling_fixtures',
    )
    expect(migration).toContain(
      'create table if not exists public.tooling_fixture_usage_records',
    )
    expect(migration).toContain('qr_token text not null')
    expect(migration).toContain("status text not null default '未使用'")
  })

  it('exposes only restricted RPCs for anonymous scan actions', () => {
    expect(existsSync(migrationPath)).toBe(true)

    const migration = readFileSync(migrationPath, 'utf8')

    expect(migration).toContain(
      'create or replace function public.get_tooling_fixture_by_qr_token',
    )
    expect(migration).toContain(
      'create or replace function public.record_tooling_fixture_action',
    )
    expect(migration).toContain('security definer')
    expect(migration).toContain(
      'revoke execute on function public.record_tooling_fixture_action',
    )
  })
})
