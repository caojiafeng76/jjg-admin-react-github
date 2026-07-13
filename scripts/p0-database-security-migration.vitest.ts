import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const MIGRATION_SUFFIX = 'harden_villa_lift_records_and_reporting_views.sql'
const MIGRATIONS_DIR = resolve(process.cwd(), 'supabase/migrations')

function loadMigration(): string {
  const migrationFiles = readdirSync(MIGRATIONS_DIR).filter((file) =>
    file.endsWith(MIGRATION_SUFFIX),
  )

  expect(migrationFiles).toHaveLength(1)

  return readFileSync(resolve(MIGRATIONS_DIR, migrationFiles[0]), 'utf8')
}

function compactSql(sql: string): string {
  return sql.replace(/--.*$/gm, ' ').replace(/\s+/g, ' ').trim()
}

function policyStatements(sql: string): string[] {
  return (
    sql.match(
      /create\s+policy\s+"[^"]+"\s+on\s+public\.villa_lift_(?:finishing|cutting)_records[\s\S]*?;/gi,
    ) ?? []
  )
}

function functionStatement(sql: string, qualifiedName: string): string {
  const escapedName = qualifiedName.replace('.', '\\.')
  const match = sql.match(
    new RegExp(
      `create or replace function ${escapedName}\\(\\)[\\s\\S]*?\\$function\\$;`,
      'i',
    ),
  )

  expect(match).not.toBeNull()

  return match?.[0] ?? ''
}

function permissionKeys(sql: string): string[] {
  return Array.from(
    sql.matchAll(/current_user_has_permission\('([^']+)'\)/gi),
    (match) => match[1],
  )
}

describe('P0 database security migration', () => {
  it('replaces broad villa-lift access with eight operation policies', () => {
    const sql = compactSql(loadMigration())

    expect(sql).toMatch(
      /alter table public\.villa_lift_finishing_records enable row level security;/i,
    )
    expect(sql).toMatch(
      /alter table public\.villa_lift_cutting_records enable row level security;/i,
    )
    expect(sql).toMatch(
      /drop policy "allow_authenticated_all" on public\.villa_lift_cutting_records;/i,
    )

    const policies = policyStatements(sql)
    expect(policies).toHaveLength(8)

    const expectedPolicies = [
      {
        table: 'finishing',
        operation: 'select',
        permission: 'page:villa-lift-processing',
        predicate: 'using',
      },
      {
        table: 'finishing',
        operation: 'insert',
        permission: 'feature:villa-lift-finishing.create',
        predicate: 'with check',
      },
      {
        table: 'finishing',
        operation: 'update',
        permission: 'feature:villa-lift-finishing.edit',
        predicate: 'using',
      },
      {
        table: 'finishing',
        operation: 'delete',
        permission: 'feature:villa-lift-finishing.delete',
        predicate: 'using',
      },
      {
        table: 'cutting',
        operation: 'select',
        permission: 'page:villa-lift-cutting-process',
        predicate: 'using',
      },
      {
        table: 'cutting',
        operation: 'insert',
        permission: 'feature:villa-lift-cutting.create',
        predicate: 'with check',
      },
      {
        table: 'cutting',
        operation: 'update',
        permission: 'feature:villa-lift-cutting.edit',
        predicate: 'using',
      },
      {
        table: 'cutting',
        operation: 'delete',
        permission: 'feature:villa-lift-cutting.delete',
        predicate: 'using',
      },
    ] as const

    for (const expected of expectedPolicies) {
      const statement = policies.find(
        (policy) =>
          new RegExp(
            `on public\\.villa_lift_${expected.table}_records for ${expected.operation}`,
            'i',
          ).test(policy) && policy.includes(`'${expected.permission}'`),
      )

      expect(statement).toBeDefined()
      expect(statement).toMatch(/to authenticated/i)
      expect(statement).toMatch(new RegExp(expected.predicate, 'i'))
      const keys = permissionKeys(statement ?? '')
      expect(new Set(keys)).toEqual(new Set([expected.permission]))
      expect(keys).toHaveLength(expected.operation === 'update' ? 2 : 1)

      if (expected.operation === 'update') {
        expect(statement).toMatch(/using\s*\([\s\S]+\)\s*with check\s*\(/i)
      }
    }

    expect(policies.join(' ')).not.toMatch(/\bfor\s+all\b/i)
    expect(policies.join(' ')).not.toMatch(
      /(?:using|with check)\s*\(\s*true\s*\)/i,
    )
  })

  it('exposes the reporting views through permission-gated private functions', () => {
    const sql = compactSql(loadMigration())
    const attendanceFunction = functionStatement(
      sql,
      'private.get_attendance_details_with_shift',
    )
    const machineFunction = functionStatement(
      sql,
      'private.get_machine_runtime_items',
    )

    expect(sql).toMatch(/create schema private;/i)
    expect(attendanceFunction).toMatch(
      /create or replace function private\.get_attendance_details_with_shift\(\)[\s\S]*?language sql stable security definer set search_path = ''/i,
    )
    expect(machineFunction).toMatch(
      /create or replace function private\.get_machine_runtime_items\(\)[\s\S]*?language sql stable security definer set search_path = ''/i,
    )

    expect(permissionKeys(attendanceFunction).sort()).toEqual([
      'page:attendance-detail',
      'page:attendance-summary',
    ])
    expect(permissionKeys(machineFunction)).toEqual(['page:machine-runtime'])
    expect(attendanceFunction).toMatch(/\(select auth\.uid\(\)\) is not null/i)
    expect(machineFunction).toMatch(/\(select auth\.uid\(\)\) is not null/i)
    expect(attendanceFunction).toMatch(
      /where \(select auth\.role\(\)\) = 'service_role' or \( \(select auth\.uid\(\)\) is not null and \(/i,
    )
    expect(machineFunction).toMatch(
      /where \(select auth\.role\(\)\) = 'service_role' or \( \(select auth\.uid\(\)\) is not null and \(select public\.current_user_has_permission\('page:machine-runtime'\)\) \)/i,
    )

    expect(attendanceFunction).toMatch(/from public\.attendance_details as ad/i)
    expect(attendanceFunction).toMatch(/join public\.employees as e/i)
    expect(attendanceFunction).toMatch(/join public\.production_orders as po/i)
    expect(machineFunction).toMatch(
      /from public\.production_order_items as poi/i,
    )
    expect(machineFunction).toMatch(/join public\.production_orders as po/i)
    expect(machineFunction).toMatch(/join public\.employees as e/i)
    expect(machineFunction).toMatch(
      /join public\.machine_equipment_maintenances as me/i,
    )
    expect(`${attendanceFunction} ${machineFunction}`).not.toMatch(
      /hourly_wage|coefficient/i,
    )

    expect(sql).toMatch(/revoke all on schema private from public, anon;/i)
    expect(sql).toMatch(
      /grant usage on schema private to authenticated, service_role;/i,
    )
    expect(sql).toMatch(
      /revoke all on function private\.get_attendance_details_with_shift\(\) from public, anon;/i,
    )
    expect(sql).toMatch(
      /revoke all on function private\.get_machine_runtime_items\(\) from public, anon;/i,
    )
    expect(sql).toMatch(
      /grant execute on function private\.get_attendance_details_with_shift\(\) to authenticated, service_role;/i,
    )
    expect(sql).toMatch(
      /grant execute on function private\.get_machine_runtime_items\(\) to authenticated, service_role;/i,
    )
    expect(sql).not.toMatch(
      /grant (?:usage|execute)[\s\S]*? to (?:public|anon)(?:[,;]|\s)/i,
    )
  })

  it('preserves the public view contracts and enables invoker security', () => {
    const sql = compactSql(loadMigration())

    expect(sql).toContain(
      'returns table ( id uuid, name text, date date, "time" time without time zone, created_at timestamp with time zone, updated_at timestamp with time zone, shift text )',
    )
    expect(sql).toContain(
      'returns table ( id uuid, order_id uuid, project_no text, product_model text, customer_model text, length_mm numeric(10, 2), operation text, incoming_qualified_quantity integer, theoretical_seconds double precision, machine_equipment_id uuid, runtime_seconds double precision, order_date date, employee_id uuid, operator_name character varying(100), unified_device_no text, device_operation text, machine_name text )',
    )
    expect(sql).toMatch(/poi\.length_mm::numeric\(10, 2\)/i)
    expect(sql).toMatch(/e\.name::character varying\(100\) as operator_name/i)
    expect(sql).toMatch(/report\.length_mm::numeric\(10, 2\) as length_mm/i)
    expect(sql).toMatch(
      /report\.operator_name::character varying\(100\) as operator_name/i,
    )

    expect(sql).toMatch(
      /create or replace view public\.attendance_details_with_shift with \(security_invoker = true\) as[\s\S]*?from private\.get_attendance_details_with_shift\(\)(?: as \w+)?;/i,
    )
    expect(sql).toMatch(/report\.date, report\."time", report\.created_at/i)
    expect(sql).toMatch(
      /create or replace view public\.v_machine_runtime_items with \(security_invoker = true\) as[\s\S]*?from private\.get_machine_runtime_items\(\)(?: as \w+)?;/i,
    )
    expect(sql).toMatch(
      /grant select on public\.attendance_details_with_shift to authenticated, service_role;/i,
    )
    expect(sql).toMatch(
      /grant select on public\.v_machine_runtime_items to authenticated, service_role;/i,
    )
    expect(sql).not.toMatch(
      /grant select on public\.(?:attendance_details_with_shift|v_machine_runtime_items) to (?:public|anon)(?:[,;]|\s)/i,
    )
  })

  it('does not widen employees access or hide the known schema drift', () => {
    const sql = compactSql(loadMigration())

    expect(sql).not.toMatch(/create\s+policy[\s\S]*?on\s+public\.employees/i)
    expect(sql).not.toMatch(/create\s+table\s+public\.villa_lift_/i)
    expect(sql).not.toMatch(/\bif\s+(?:not\s+)?exists\b/i)
    expect(sql).not.toMatch(/\bdo\s+\$/i)
  })
})
