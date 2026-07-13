import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260713060000_harden_syney_and_workshop_permissions.sql',
)

function readMigration(): string {
  return readFileSync(migrationPath, 'utf8').replace(/\s+/g, ' ')
}

describe('Syney and workshop permission hardening migration', () => {
  it('replaces legacy authenticated-wide Syney policies', () => {
    const sql = readMigration()

    for (const policy of [
      'Syney pos authenticated rw',
      'Syney po items authenticated rw',
      'Syney serial no authenticated rw',
      'Syney specs authenticated rw',
      'Syney store reports authenticated rw',
      'Syney store report items authenticated rw',
    ]) {
      expect(sql).toContain(`drop policy if exists "${policy}"`)
    }

    expect(sql).not.toMatch(/create policy .*auth\.role\(\)\s*=\s*'authenticated'/i)
  })

  it('splits PO and item mutations by page/create/edit/delete permission', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /create policy "syney_pos_select" .* for select .* (?:public\.)?current_user_has_permission\('page:syney-po-list'\)/i,
    )
    expect(sql).toMatch(
      /create policy "syney_pos_insert" .* for insert .* (?:public\.)?current_user_has_permission\('feature:syney-po-list\.create'\)/i,
    )
    expect(sql).toMatch(
      /create policy "syney_pos_update" .* for update .* using .*feature:syney-po-list\.edit.* with check .*feature:syney-po-list\.edit/i,
    )
    expect(sql).toMatch(
      /create policy "syney_pos_delete" .* for delete .* (?:public\.)?current_user_has_permission\('feature:syney-po-list\.delete'\)/i,
    )
    expect(sql).toMatch(
      /create policy "syney_po_items_update" .* for update .* using .*feature:syney-po-list\.edit.* with check .*feature:syney-po-list\.edit/i,
    )
  })

  it('keeps Syney settings and store-report tables permission gated', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /on public\."syney-serial-no" for all to authenticated using \( .*page:syney-setting.* \) with check \( .*page:syney-setting.* \)/i,
    )
    expect(sql).toMatch(
      /on public\."syney-store-reports" for all to authenticated using \( .*page:syney-store-report-list.* \) with check \( .*page:syney-store-report-list.* \)/i,
    )
    expect(sql).toMatch(
      /on public\."syney-store-report-items" for all to authenticated using \( .*page:syney-store-report-list.* \) with check \( .*page:syney-store-report-list.* \)/i,
    )
  })

  it('requires a workshop page permission inside the options RPC', () => {
    const sql = readMigration()

    expect(sql).toMatch(
      /create or replace function public\.get_workshop_order_options\(\).*current_user_has_permission\('page:workshop-order-production'\).*current_user_has_permission\('page:workshop-order-closed'\)/i,
    )
    expect(sql).toMatch(/raise exception using errcode = '42501'/i)
    expect(sql).toMatch(
      /revoke all on function public\.get_workshop_order_options\(\) from public, anon/i,
    )
  })
})
