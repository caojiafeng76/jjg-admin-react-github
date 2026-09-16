import { createHash } from 'node:crypto'
import { createInterface } from 'node:readline/promises'

// Lex comments and literals before inspecting SQL keywords; function bodies require review.
export function inspectSql(sql) {
  const tokens = []
  let i = 0
  while (i < sql.length) {
    if (sql.startsWith('--', i)) {
      const end = sql.indexOf('\n', i + 2)
      i = end < 0 ? sql.length : end + 1
    } else if (sql.startsWith('/*', i)) {
      let depth = 1
      i += 2
      while (i < sql.length && depth) {
        if (sql.startsWith('/*', i)) {
          depth++
          i += 2
        } else if (sql.startsWith('*/', i)) {
          depth--
          i += 2
        } else i++
      }
      if (depth) throw new Error('SQL 块注释未闭合，已阻止执行。')
    } else if (sql[i] === "'" || sql[i] === '"') {
      const quote = sql[i]
      const escapes =
        quote === "'" && /(?:^|[^a-z0-9_])e$/i.test(sql.slice(0, i))
      i++
      let closed = false
      while (i < sql.length) {
        if (escapes && sql.charCodeAt(i) === 92) {
          i += 2
          continue
        }
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) {
            i += 2
            continue
          }
          i++
          closed = true
          break
        }
        i++
      }
      if (!closed) throw new Error('SQL 引号未闭合，已阻止执行。')
      tokens.push('LITERAL')
    } else if (
      sql[i] === '$' &&
      /^\$(?:[a-z_][a-z0-9_]*)?\$/i.test(sql.slice(i))
    ) {
      const delimiter = sql.slice(i).match(/^\$(?:[a-z_][a-z0-9_]*)?\$/i)[0]
      const end = sql.indexOf(delimiter, i + delimiter.length)
      if (end < 0) throw new Error('SQL dollar quote 未闭合，已阻止执行。')
      i = end + delimiter.length
      tokens.push('LITERAL')
    } else if (/[a-z_]/i.test(sql[i])) {
      const word = sql.slice(i).match(/^[a-z_][a-z0-9_$]*/i)[0]
      tokens.push(word.toUpperCase())
      i += word.length
    } else {
      if (sql.charCodeAt(i) === 92)
        throw new Error('不允许通过 SQL 文件执行客户端元命令。')
      i++
    }
  }
  const reasons = tokens.filter((word) =>
    [
      'DELETE',
      'DROP',
      'TRUNCATE',
      'DO',
      'CALL',
      'EXECUTE',
      'PROGRAM',
      'LO_UNLINK',
      'STANDARD_CONFORMING_STRINGS',
      'FUNCTION',
      'PROCEDURE',
      'TRIGGER',
      'RULE',
    ].includes(word),
  )
  return {
    requiresConfirmation: reasons.length > 0,
    reasons: [...new Set(reasons)],
  }
}

export async function confirmSqlExecution(sql, target, options = {}) {
  const inspection = inspectSql(sql)
  if (!inspection.requiresConfirmation) return
  const interactive =
    options.interactive ?? Boolean(process.stdin.isTTY && process.stdout.isTTY)
  if (!interactive)
    throw new Error(
      '已阻止危险数据库操作：需要用户本人在交互终端核对 SQL 并连续确认三次；不能用参数、环境变量或管道代替。',
    )
  const digest = createHash('sha256')
    .update(target)
    .update('\0')
    .update(sql)
    .digest('hex')
    .slice(0, 12)
  const display = options.display ?? console.log
  display(
    `数据库目标：${target}\nSQL 指纹：${digest}\n需复核：${inspection.reasons.join(', ')}\n${sql}`,
  )
  const terminal = options.ask
    ? undefined
    : createInterface({ input: process.stdin, output: process.stdout })
  const ask =
    options.ask ?? ((expected) => terminal.question(`请输入“${expected}”：`))
  try {
    for (let step = 1; step <= 3; step++) {
      const expected = `确认 ${digest} 第${step}次`
      if ((await ask(expected)).trim() !== expected)
        throw new Error('确认不匹配，已取消数据库操作。')
    }
  } finally {
    terminal?.close()
  }
}

export function parseQueryArgs(args) {
  const valueFlags = new Set([
    '--db-url',
    '--workdir',
    '--profile',
    '--output-format',
    '--output',
    '-o',
    '--dns-resolver',
  ])
  const booleanFlags = new Set(['--linked', '--local', '--debug'])
  const forwardArgs = []
  const targets = new Set()
  const seenOptions = new Set()
  let file
  let sql
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--') continue
    const equals = arg.indexOf('=')
    const flag = equals > 0 ? arg.slice(0, equals) : arg
    if (valueFlags.has(flag) || booleanFlags.has(flag)) {
      if (seenOptions.has(flag)) throw new Error(`参数 ${flag} 不能重复。`)
      seenOptions.add(flag)
    }
    if (flag === '--file' || flag === '-f' || valueFlags.has(flag)) {
      const value = equals > 0 ? arg.slice(equals + 1) : args[++i]
      if (!value || value.startsWith('--'))
        throw new Error(`参数 ${flag} 缺少值。`)
      if (flag === '--file' || flag === '-f') {
        if (file !== undefined) throw new Error('只能提供一个 SQL 文件。')
        file = value
      } else {
        if (flag === '--db-url') targets.add(flag)
        if (equals > 0) forwardArgs.push(arg)
        else forwardArgs.push(flag, value)
      }
    } else if (booleanFlags.has(arg)) {
      if (arg === '--local' || arg === '--linked') targets.add(arg)
      forwardArgs.push(arg)
    } else if (arg.startsWith('-')) {
      throw new Error(`未支持的参数 ${flag}；为保证 SQL 检查完整，已停止执行。`)
    } else {
      if (sql !== undefined) throw new Error('只能提供一段 SQL。')
      sql = arg
    }
  }
  if (targets.size > 1) throw new Error('不能同时指定多个数据库目标。')
  if ((file !== undefined) === (sql !== undefined))
    throw new Error('请仅提供一个 SQL 文件或一段 SQL。')
  return { forwardArgs, file, sql }
}

export function parseMigrationPreview(output) {
  const candidates = output.split('\n').flatMap((line) => {
    try {
      return [JSON.parse(line)]
    } catch {
      return []
    }
  })
  const plans = candidates.filter((item) => item?.dryRun === true)
  if (plans.length !== 1)
    throw new Error('未获得唯一的结构化 migration 预演结果，已停止执行。')
  const plan = plans[0]
  if (
    !Array.isArray(plan.migrations) ||
    !Array.isArray(plan.seeds) ||
    !Array.isArray(plan.roles) ||
    plan.seeds.length ||
    plan.roles.length ||
    plan.migrations.some(
      (name) =>
        typeof name !== 'string' || !/^[0-9]+_[a-z0-9_-]+\.sql$/i.test(name),
    )
  ) {
    throw new Error(
      '迁移预演包含未支持的文件、seed 或 roles；请拆为可审查的 migration。',
    )
  }
  return plan.migrations
}
