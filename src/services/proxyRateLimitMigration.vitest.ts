import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260713062000_add_distributed_proxy_rate_limit.sql',
  ),
  'utf8',
)
const hardeningMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260713062500_hide_proxy_rate_limit_definer.sql',
  ),
  'utf8',
)
const poisoningPreventionMigration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260713063000_prevent_proxy_rate_limit_ip_poisoning.sql',
  ),
  'utf8',
)

describe('distributed proxy rate limit migration', () => {
  it('stores counters outside ephemeral function instances', () => {
    expect(migration).toContain('private.proxy_rate_limits')
    expect(migration).toContain('public.consume_proxy_rate_limit')
    expect(migration).toContain('security definer')
  })

  it('starts with transactional counters and serializes concurrent calls', () => {
    expect(migration).toContain("subject_kind = 'user'")
    expect(migration).toContain('pg_advisory_xact_lock')
    expect(migration).toContain('>= 30')
  })

  it('prevents caller-controlled IP values from poisoning other users', () => {
    expect(poisoningPreventionMigration).toContain(
      "subject_kind in ('user', 'user_ip')",
    )
    expect(poisoningPreventionMigration).toContain(
      "subject_kind = 'user_ip'",
    )
    expect(poisoningPreventionMigration).toContain(
      "concat(v_user_id::text, ':', v_ip)",
    )
    expect(poisoningPreventionMigration).not.toContain(
      "subject_kind = 'ip'",
    )
  })

  it('allows only authenticated callers and validates proxy scope permission', () => {
    expect(migration).toContain('auth.uid()')
    expect(migration).toContain('current_user_has_permission')
    expect(migration).toContain(
      'revoke all on function public.consume_proxy_rate_limit(text, text) from public, anon',
    )
    expect(migration).toContain('to authenticated, service_role')
  })

  it('keeps the definer implementation outside the exposed API schema', () => {
    expect(hardeningMigration).toContain(
      'alter function public.consume_proxy_rate_limit(text, text)',
    )
    expect(hardeningMigration).toContain('set schema private')
    expect(hardeningMigration).toContain('security invoker')
    expect(hardeningMigration).toContain(
      'select private.consume_proxy_rate_limit(p_scope, p_ip)',
    )
  })

  it('does not store raw user or IP identifiers', () => {
    expect(migration).toContain('extensions.digest')
    expect(migration).toContain('v_user_hash')
    expect(migration).toContain('v_ip_hash')
  })
})
