import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  inspectSql,
  confirmSqlExecution,
  parseQueryArgs,
  parseMigrationPreview,
} from './db-sql-guard.mjs'

for (const sql of [
  'DELETE/**/FROM orders',
  'WITH gone AS (DELETE FROM orders RETURNING *) SELECT * FROM gone',
  'TRUNCATE orders',
  'ALTER TABLE orders DROP COLUMN status',
  "DO $$ BEGIN EXECUTE 'DEL' || 'ETE FROM orders'; END $$",
  'CALL clear_orders()',
  "COPY orders TO PROGRAM 'rm file'",
]) {
  test(`requires review: ${sql.slice(0, 45)}`, () =>
    assert.equal(inspectSql(sql).requiresConfirmation, true))
}
for (const sql of [
  "select 'DELETE FROM orders'",
  '-- DELETE FROM orders\nselect 1',
  '/* outer /* DELETE */ comment */ select 1',
  "update orders set status='生产中' where customer='优迈'",
  'select "delete" from logs',
]) {
  test(`allows ordinary SQL: ${sql.slice(0, 40)}`, () =>
    assert.equal(inspectSql(sql).requiresConfirmation, false))
}
test('unterminated SQL is rejected rather than hiding later tokens', () => {
  assert.throws(() => inspectSql("select 'unterminated"))
  assert.throws(() => inspectSql('/* unterminated'))
  assert.throws(() => inspectSql(String.fromCharCode(92) + 'i other.sql'))
})
test('noninteractive destructive SQL never prompts or executes', async () => {
  await assert.rejects(
    confirmSqlExecution('delete from orders', 'linked:test', {
      interactive: false,
    }),
    /三次/,
  )
})
test('three confirmations must be exact and scoped to this operation', async () => {
  const prompts = []
  await confirmSqlExecution('delete from orders where id=1', 'linked:test', {
    interactive: true,
    ask: async (expected) => {
      prompts.push(expected)
      return expected
    },
    display: () => {},
  })
  assert.equal(prompts.length, 3)
  assert.match(prompts[0], /第1次$/)
  assert.match(prompts[2], /第3次$/)
  await assert.rejects(
    confirmSqlExecution('delete from orders where id=2', 'linked:test', {
      interactive: true,
      ask: async () => prompts[0],
      display: () => {},
    }),
    /取消/,
  )
})
test('SQL file options and targets are parsed unambiguously', () => {
  assert.deepEqual(
    parseQueryArgs(['--db-url=postgresql://host/db', '--file=x.sql']),
    {
      forwardArgs: ['--db-url=postgresql://host/db'],
      file: 'x.sql',
      sql: undefined,
    },
  )
  assert.equal(parseQueryArgs(['--local', 'select 1']).sql, 'select 1')
  assert.throws(() => parseQueryArgs(['--file', 'one.sql', '--file=two.sql']))
  assert.throws(() =>
    parseQueryArgs(['--file', 'one.sql', 'delete from orders']),
  )
  assert.throws(() => parseQueryArgs(['--db-url', 'postgresql://host/db']))
  assert.throws(() => parseQueryArgs(['--unknown', 'select 1']))
  assert.throws(() => parseQueryArgs(['--local', '--linked', 'select 1']))
})
test('migration preview must be complete structured JSON with safe filenames', () => {
  assert.deepEqual(
    parseMigrationPreview(
      '{"dryRun":true,"migrations":["20260916000000_new.sql"],"seeds":[],"roles":[]}',
    ),
    ['20260916000000_new.sql'],
  )
  assert.throws(() => parseMigrationPreview('Would push 1 migration'))
  assert.throws(() =>
    parseMigrationPreview(
      '{"dryRun":true,"migrations":["../../other.sql"],"seeds":[],"roles":[]}',
    ),
  )
  assert.throws(() =>
    parseMigrationPreview(
      '{"dryRun":true,"migrations":[],"seeds":["seed.sql"],"roles":[]}',
    ),
  )
})

test('migration review detects new or modified files before execution', async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } =
    await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { captureMigrationPlan } = await import('./db-migration-guard.mjs')
  const dir = mkdtempSync(join(tmpdir(), 'jjg-guard-test-'))
  try {
    mkdirSync(join(dir, 'supabase/migrations'), { recursive: true })
    writeFileSync(
      join(dir, 'supabase/migrations/20260916000000_test.sql'),
      'delete from orders;',
    )
    const plan = captureMigrationPlan(
      '{"dryRun":true,"migrations":["20260916000000_test.sql"],"seeds":[],"roles":[]}',
      dir,
    )
    assert.equal(inspectSql(plan.sql).requiresConfirmation, true)
    plan.assertUnchanged()
    writeFileSync(
      join(dir, 'supabase/migrations/20260917000000_other.sql'),
      'drop table orders;',
    )
    assert.throws(() => plan.assertUnchanged(), /变化/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('real query entry rejects a dangerous file before invoking the database CLI', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const { spawnSync } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const dir = mkdtempSync(join(tmpdir(), 'jjg-guard-entry-'))
  try {
    const file = join(dir, 'danger.sql')
    writeFileSync(
      file,
      'WITH removed AS (DELETE/**/FROM never_execute RETURNING *) SELECT * FROM removed;',
    )
    const result = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL('./supabase-db-query.mjs', import.meta.url)),
        '--db-url=postgresql://localhost:1/postgres',
        '--file=' + file,
      ],
      { encoding: 'utf8', timeout: 5000 },
    )
    assert.equal(result.status, 1)
    assert.match(result.stderr, /三次/)
    assert.doesNotMatch(result.stderr, /Connecting|ECONNREFUSED/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('large checked SQL uses a private snapshot that is cleaned on failure', async () => {
  const { readFileSync, existsSync } = await import('node:fs')
  const { withSqlSnapshot } = await import('./db-sql-snapshot.mjs')
  const sql = "select '" + 'a'.repeat(100000) + "';"
  let snapshot
  assert.throws(
    () =>
      withSqlSnapshot(sql, (file) => {
        snapshot = file
        assert.equal(readFileSync(file, 'utf8'), sql)
        throw new Error('simulated CLI failure')
      }),
    /simulated/,
  )
  assert.equal(existsSync(snapshot), false)
})

test('legacy migration alias preserves validation failures without executing SQL', async () => {
  const { spawnSync } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const result = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('./supabase-db-push-api.mjs', import.meta.url)),
      '--local',
      '--dry-run=false',
    ],
    { encoding: 'utf8', timeout: 5000 },
  )
  assert.equal(result.status, 1)
  assert.match(result.stderr, /独立的 --dry-run/)
})

test('optional hook blocks raw database tools without intercepting guarded entrypoints', async () => {
  const { spawnSync } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const script = fileURLToPath(
    new URL('./db-destructive-guard.mjs', import.meta.url),
  )
  for (const command of [
    'supabase db reset',
    'bunx supabase db query "select 1"',
  ]) {
    const result = spawnSync(process.execPath, [script], {
      input: JSON.stringify({
        hook_event_name: 'PreToolUse',
        tool_input: { command },
      }),
      encoding: 'utf8',
    })
    assert.equal(
      JSON.parse(result.stdout).hookSpecificOutput.permissionDecision,
      'deny',
    )
  }
  const result = spawnSync(process.execPath, [script], {
    input: JSON.stringify({
      hook_event_name: 'PreToolUse',
      tool_input: { command: 'bun run db:query -- "select 1"' },
    }),
    encoding: 'utf8',
  })
  assert.equal(result.status, 0)
  assert.equal(result.stdout, '')
})

test('duplicate connection or workspace options cannot change the reviewed target', () => {
  assert.throws(() =>
    parseQueryArgs([
      '--db-url=postgresql://one/db',
      '--db-url=postgresql://two/db',
      'delete from orders',
    ]),
  )
  assert.throws(() =>
    parseQueryArgs(['--workdir', 'one', '--workdir=two', 'select 1']),
  )
})
