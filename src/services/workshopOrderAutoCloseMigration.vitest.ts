import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationDirectory = resolve(process.cwd(), 'supabase/migrations')
const migrationNames = readdirSync(migrationDirectory).filter((name) =>
  name.endsWith('_workshop_order_auto_close.sql'),
)

function readMigration(): string {
  expect(migrationNames).toHaveLength(1)

  return readFileSync(
    resolve(migrationDirectory, migrationNames[0]!),
    'utf8',
  ).replace(/\s+/g, ' ')
}

describe('workshop order auto-close migration', () => {
  it('defines completion tracking and permanent reopen exemption', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /add column if not exists completion_reached_at timestamptz/i,
    )
    expect(sql).toMatch(
      /add column if not exists auto_close_disabled boolean not null default false/i,
    )
    expect(sql).toMatch(
      /old\.status = '已结案'.*new\.status = '生产中'.*new\.auto_close_disabled = true/i,
    )
  })

  it('synchronizes completion from transfers and order quantity changes', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /create or replace function private\.refresh_workshop_order_completion/i,
    )
    expect(sql).toMatch(/for update.*select coalesce\(sum\(transfer_quantity\)/i)
    expect(sql).toMatch(
      /create trigger sync_workshop_order_completion_from_transfer/i,
    )
    expect(sql).toMatch(
      /create trigger sync_workshop_order_completion_from_order/i,
    )
    expect(sql).toMatch(/completion_reached_at is distinct from/i)
  })

  it('defines a hardened private closer and one named cron job', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /create or replace function private\.close_eligible_workshop_orders/i,
    )
    expect(sql).toMatch(
      /completion_reached_at <= now\(\) - interval '2 days'/i,
    )
    expect(sql).toMatch(/cron\.unschedule\(jobid\)/i)
    expect(sql).toMatch(
      /cron\.schedule\( 'workshop-order-auto-close', '\*\/15 \* \* \* \*'/i,
    )
    expect(sql).toMatch(
      /revoke all on function private\.close_eligible_workshop_orders\(\) from public, anon, authenticated/i,
    )
  })

  it('backfills only production orders before the initial close run', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /sum\(transfers\.transfer_quantity\) over .*order by transfers\.created_at, transfers\.id/i,
    )
    expect(sql).toMatch(/where so\.status = '生产中'/i)
    expect(sql).toMatch(/select private\.close_eligible_workshop_orders\(\)/i)
  })
})
