import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationSql = readFileSync(
  resolve(
    'supabase/migrations/20260713044250_add_syney_natural_sort_collation.sql',
  ),
  'utf8',
)
const normalizedSql = migrationSql.replace(/\s+/g, ' ')

describe('Syney natural sort migration', () => {
  it('does not use reserved SQL words as catalog aliases', () => {
    expect(normalizedSql).not.toMatch(/\bas collation\b/i)
    expect(normalizedSql).not.toMatch(/\bas namespace\b/i)
    expect(normalizedSql).not.toMatch(
      /\bcollation\.(collprovider|collisdeterministic|colliculocale|collnamespace|collname)\b/i,
    )
  })

  it('creates a deterministic numeric ICU collation and rejects name conflicts', () => {
    expect(normalizedSql).toMatch(
      /create collation if not exists public\.zh_cn_numeric \( provider = icu, locale = 'zh-Hans-CN-u-kn-true', deterministic = true \)/i,
    )
    expect(normalizedSql).toMatch(/from pg_catalog\.pg_collation/i)
    expect(normalizedSql).toMatch(/collprovider <> 'i'/i)
    expect(normalizedSql).toMatch(/not v_collation\.collisdeterministic/i)
    expect(normalizedSql).toMatch(
      /colliculocale not in \( 'zh-Hans-CN-u-kn-true', 'zh-Hans-CN-u-kn' \)/i,
    )
    expect(normalizedSql).toMatch(/raise exception/i)
  })

  it('replaces the invoker view with natural No and SONo sort keys', () => {
    expect(normalizedSql).toMatch(
      /create or replace view public\.syney_pos_sorted with \(security_invoker = true\) as select po\.\*/i,
    )
    expect(normalizedSql).toMatch(/as status_sort_weight/i)
    expect(normalizedSql).toMatch(/as end_date_sort_key/i)
    expect(normalizedSql).toMatch(
      /coalesce\(po\."No", ''\) collate public\.zh_cn_numeric as no_natural_sort_key/i,
    )
    expect(normalizedSql).toMatch(
      /coalesce\(po\."SONo", ''\) collate public\.zh_cn_numeric as sono_natural_sort_key/i,
    )
  })

  it('keeps the view unavailable to anonymous users', () => {
    expect(normalizedSql).toMatch(
      /revoke all on table public\.syney_pos_sorted from public, anon/i,
    )
    expect(normalizedSql).toMatch(
      /grant select on table public\.syney_pos_sorted to authenticated, service_role/i,
    )
  })
})
