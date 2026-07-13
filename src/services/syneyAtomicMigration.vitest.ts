import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationSql = readFileSync(
  resolve(
    'supabase/migrations/20260713040208_add_syney_atomic_update_and_sorted_view.sql',
  ),
  'utf8',
)
const normalizedSql = migrationSql.replace(/\s+/g, ' ')

describe('Syney atomic update migration', () => {
  it('defines an invoker RPC with a safe search path and restricted grants', () => {
    expect(normalizedSql).toMatch(
      /create or replace function public\.update_syney_po_items\s*\(\s*p_ids bigint\[\],\s*p_values jsonb\s*\)\s*returns integer/i,
    )
    expect(normalizedSql).toMatch(/security invoker set search_path = ''/i)
    expect(normalizedSql).toMatch(
      /revoke all on function public\.update_syney_po_items\(bigint\[\], jsonb\) from public, anon/i,
    )
    expect(normalizedSql).toMatch(
      /grant execute on function public\.update_syney_po_items\(bigint\[\], jsonb\) to authenticated, service_role/i,
    )
  })

  it('rejects empty identifiers, empty patches, and fields outside the whitelist', () => {
    expect(normalizedSql).toMatch(/cardinality\(p_ids\) = 0/i)
    expect(normalizedSql).toMatch(
      /from unnest\(p_ids\).*where.*id is null or.*id <= 0/i,
    )
    expect(normalizedSql).toMatch(/jsonb_typeof\(p_values\) <> 'object'/i)
    expect(normalizedSql).toMatch(/p_values = '\{\}'::jsonb/i)
    expect(normalizedSql).toMatch(/jsonb_object_keys\(p_values\)/i)

    for (const field of [
      'No',
      'ParamSpec',
      'PartCode',
      'PartModel',
      'PartName',
      'PartName2',
      'PartNo',
      'PoId',
      'Qty',
      'Remark',
      'SONo',
      'Spec',
      'Unit',
    ]) {
      expect(normalizedSql).toContain(`'${field}'`)
    }
  })

  it('uses patch semantics and preserves explicit JSON null as SQL null', () => {
    expect(normalizedSql).toMatch(
      /v_patch := pg_catalog\.jsonb_populate_record\(\s*null::public\."syney-po-items", p_values\s*\)/i,
    )

    for (const field of [
      'No',
      'ParamSpec',
      'PartCode',
      'PartModel',
      'PartName',
      'PartName2',
      'PartNo',
      'PoId',
      'Qty',
      'Remark',
      'SONo',
      'Spec',
      'Unit',
    ]) {
      expect(normalizedSql).toMatch(
        new RegExp(
          `"${field}"\\s*=\\s*case when p_values \\? '${field}' then v_patch\\."${field}" else item\\."${field}" end`,
          'i',
        ),
      )
    }
  })

  it('updates every distinct target and raises so all changes roll back on drift', () => {
    expect(normalizedSql).toMatch(
      /select count\(distinct id\).*from unnest\(p_ids\)/i,
    )
    expect(normalizedSql).toMatch(
      /with updated_rows as \( update public\."syney-po-items"/i,
    )
    expect(normalizedSql).toMatch(/where item\.id = any\(p_ids\)/i)
    expect(normalizedSql).toMatch(
      /if v_updated_count <> v_expected_count then raise exception/i,
    )
  })

  it('creates missing specifications from updated rows without duplicate PartNo values', () => {
    expect(normalizedSql).toMatch(
      /insert into public\."syney-specs" \(\s*"ParamSpec", "PartName", "PartNo", "Spec"\s*\)/i,
    )
    expect(normalizedSql).toMatch(/from updated_rows/i)
    expect(normalizedSql).toMatch(
      /nullif\(btrim\("PartNo"\), ''\) is not null/i,
    )
    expect(normalizedSql).toMatch(/on conflict \("PartNo"\) do nothing/i)
  })

  it('lets specification insert failures abort the same function statement', () => {
    const functionBody = normalizedSql.match(
      /create or replace function public\.update_syney_po_items[\s\S]*?as \$\$([\s\S]*?)\$\$/i,
    )?.[1]

    expect(functionBody).toMatch(
      /with updated_rows as \( update public\."syney-po-items"[\s\S]*inserted_specs as \( insert into public\."syney-specs"/i,
    )
    expect(functionBody).not.toMatch(/\bexception\s+when\b/i)
  })

  it('exposes stable status and date sort keys through an invoker view', () => {
    expect(normalizedSql).toMatch(
      /create or replace view public\.syney_pos_sorted with \(security_invoker = true\) as/i,
    )
    expect(normalizedSql).toMatch(
      /when po\."Status" = '已创建' then 1.*when po\."Status" in \('部分入库', '部分送货'\) then 2.*when po\."Status" = '已入库' then 3.*else 4.*end::smallint as status_sort_weight/i,
    )
    expect(normalizedSql).toMatch(
      /when po\."Status" = '已入库'.*coalesce\(-to_char\(po\."EndDate", 'YYYYMMDD'\)::integer, 2147483647\).*else coalesce\(to_char\(po\."EndDate", 'YYYYMMDD'\)::integer, 0\).*end::integer as end_date_sort_key/i,
    )
    expect(normalizedSql).toMatch(
      /revoke all on table public\.syney_pos_sorted from public, anon/i,
    )
    expect(normalizedSql).toMatch(
      /grant select on table public\.syney_pos_sorted to authenticated, service_role/i,
    )
  })
})
