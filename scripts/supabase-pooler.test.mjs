import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildPoolerConnection, resolvePushTarget } from './supabase-pooler.mjs'

const ref = 'mlcptrkvkseyqxxlfcme'
const cached = `postgresql://postgres.${ref}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`

test('pooler keeps temporary password out of command arguments', () => {
  const result = buildPoolerConnection(cached, ref, {
    role: 'cli_login_postgres',
    password: 'temporary:/secret@123',
  })
  assert.equal(new URL(result.url).username, `cli_login_postgres.${ref}`)
  assert.equal(new URL(result.url).password, '')
  assert.equal(result.env.PGPASSWORD, 'temporary:/secret@123')
  assert.equal(new URL(result.url).port, '5432')
})

test('pooler rejects another project and unexpected hosts', () => {
  assert.throws(() =>
    buildPoolerConnection(cached, 'otherproject', {
      role: 'cli_login_postgres',
      password: 'secret',
    }),
  )
  assert.throws(() =>
    buildPoolerConnection(
      cached.replace('pooler.supabase.com', 'example.com'),
      ref,
      { role: 'cli_login_postgres', password: 'secret' },
    ),
  )
})

test('missing login password fails before starting CLI', () => {
  assert.throws(() =>
    buildPoolerConnection(cached, ref, { role: 'cli_login_postgres' }),
  )
})

test('explicit targets stay explicit, including equals syntax', () => {
  assert.equal(resolvePushTarget(['--local'], {}).mode, 'native')
  assert.equal(
    resolvePushTarget(['--db-url=postgresql://example/db'], {}).mode,
    'native',
  )
  assert.equal(resolvePushTarget(['--no-fallback'], {}).mode, 'native')
  assert.equal(
    resolvePushTarget([], { SUPABASE_DB_URL: 'postgresql://example/db' }).mode,
    'native',
  )
  assert.equal(resolvePushTarget([], {}).mode, 'pooler')
  assert.equal(resolvePushTarget(['--linked', '--dry-run'], {}).mode, 'pooler')
})

test('conflicting targets fail before choosing a database', () => {
  assert.throws(() => resolvePushTarget(['--local', '--linked'], {}))
})

test('CLI JSON errors with exit zero are treated as failures and passwords are redacted', async () => {
  const { normalizeCliResult } = await import('./supabase-cli-utils.mjs')
  const result = normalizeCliResult(
    {
      status: 0,
      stdout: '{"_tag":"Error","error":{"message":"secret-value"}}',
      stderr: '',
    },
    ['secret-value'],
  )
  assert.equal(result.status, 1)
  assert.ok(!result.stdout.includes('secret-value'))
  assert.ok(result.stdout.includes('[redacted]'))
})

test('restored migration history preserves every archived source and records provenance', async () => {
  const { readFileSync, readdirSync } = await import('node:fs')
  const { createHash } = await import('node:crypto')
  const root = new URL('../supabase/', import.meta.url)
  const manifest = JSON.parse(
    readFileSync(new URL('migration-history-20260916.json', root), 'utf8'),
  )
  const hash = (path) =>
    createHash('sha256')
      .update(
        readFileSync(new URL(path, root), 'utf8').replaceAll('\r\n', '\n'),
      )
      .digest('hex')
  assert.equal(manifest.migrations.length, 240)
  assert.equal(
    manifest.migrations.filter((row) => row.source === 'local-reconstruction')
      .length,
    37,
  )
  const archived = new Set()
  for (const row of manifest.migrations) {
    assert.equal(hash(`migrations/${row.file}`), row.sha256, row.file)
    if (row.archivedFile) {
      archived.add(row.archivedFile)
      assert.equal(
        hash(`migrations-archive/20260916/${row.archivedFile}`),
        row.archivedSha256,
      )
    }
    if (row.source === 'local-reconstruction')
      assert.equal(row.sha256, row.archivedSha256)
    else assert.equal(row.sha256, row.remoteSha256)
  }
  assert.equal(archived.size, 190)
  assert.deepEqual(
    new Set(readdirSync(new URL('migrations-archive/20260916/', root))),
    archived,
  )
})

test('push rejects repeated target or workdir options before resolving credentials', () => {
  assert.throws(() =>
    resolvePushTarget(
      ['--db-url=postgresql://one/db', '--db-url=postgresql://two/db'],
      {},
    ),
  )
  assert.throws(() =>
    resolvePushTarget(['--workdir', 'one', '--workdir=two'], {}),
  )
  assert.throws(() => resolvePushTarget(['--linked=false'], {}))
})
