import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260713050000_add_workshop_order_options_rpc.sql',
)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8')
}

describe('workshop order options RPC migration', () => {
  it('returns the three option collections from one invoker-rights RPC', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /create or replace function public\.get_workshop_order_options\(\)/i,
    )
    expect(sql).toMatch(
      /returns table\s*\(\s*project_nos text\[\],\s*product_models text\[\],\s*lengths numeric\[\]\s*\)/i,
    )
    expect(sql).toMatch(/language sql\s+stable\s+security invoker/i)
    expect(sql).toMatch(/set search_path = ''/i)
  })

  it('deduplicates, trims, and sorts all options in one sales_orders scan', () => {
    const sql = readMigration()

    expect(sql.match(/from public\.sales_orders/gi)).toHaveLength(1)
    expect(sql).toMatch(/array_agg\(distinct btrim\(project_no\)/i)
    expect(sql).toMatch(/array_agg\(distinct btrim\(product_model\)/i)
    expect(sql).toMatch(/array_agg\(distinct length_mm/i)
    expect(sql).toMatch(/filter\s*\(\s*where project_no is not null/i)
    expect(sql).toMatch(/filter\s*\(\s*where product_model is not null/i)
    expect(sql).toMatch(/filter\s*\(\s*where length_mm is not null/i)
  })

  it('exposes the RPC only to signed-in and service roles', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /revoke all on function public\.get_workshop_order_options\(\) from public, anon/i,
    )
    expect(sql).toMatch(
      /grant execute on function public\.get_workshop_order_options\(\)\s+to authenticated, service_role/i,
    )
  })
})
