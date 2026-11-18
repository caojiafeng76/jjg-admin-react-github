import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

const changelogPath = 'CHANGELOG.MD'
const emptySha = /^0{40}$/
const entryHeading = /^## \d{4}-\d{2}-\d{2}[ \t]*$/
const fieldNames = ['类别', '范围', '摘要', '验证']

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

function resolveCommit(ref) {
  if (typeof ref !== 'string' || !ref.trim())
    throw new Error('缺少用于比较的提交引用。')

  try {
    return git('rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`).trim()
  }
  catch {
    throw new Error(`无法读取提交 ${ref}，请检查引用并确保已获取对应 Git 历史。`)
  }
}

function comparisonRange(args) {
  const { values } = parseArgs({
    args,
    options: {
      'base': { type: 'string' },
      'head': { type: 'string' },
      'github-event': { type: 'boolean' },
      'help': { type: 'boolean' },
    },
  })

  if (values.help) {
    console.log('用法：bun run changelog:check --base <ref> --head <ref>，或使用 --github-event 读取 GitHub Actions 事件。')
    return null
  }

  if (!values['github-event'])
    return { base: resolveCommit(values.base), head: resolveCommit(values.head) }

  if (values.base !== undefined || values.head !== undefined)
    throw new Error('请分别使用提交参数或 GitHub 事件模式。')

  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
  switch (process.env.GITHUB_EVENT_NAME) {
    case 'pull_request': {
      const base = resolveCommit(event.pull_request?.base?.sha)
      const head = resolveCommit(event.pull_request?.head?.sha)
      return { base: git('merge-base', base, head).trim(), head }
    }
    case 'push': {
      if (event.deleted === true && emptySha.test(event.after)) {
        console.log('分支删除事件没有待检查的提交。')
        return null
      }
      const base = event.created === true && emptySha.test(event.before)
        ? null
        : resolveCommit(event.before)
      return { base, head: resolveCommit(event.after) }
    }
    default:
      throw new Error(`不支持的 GitHub 事件：${process.env.GITHUB_EVENT_NAME}。`)
  }
}

function listEntries(contents) {
  const lines = contents.replaceAll('\r\n', '\n').split('\n')
  const headings = []
  let fence

  for (const [index, line] of lines.entries()) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !line.slice(marker[0].length).trim())
        fence = undefined
      continue
    }

    if (marker)
      fence = marker[1]
    else if (entryHeading.test(line))
      headings.push(index)
  }

  return headings.map((start, index) => lines.slice(start, headings[index + 1]).join('\n').trim())
}

function readEntries(commit) {
  if (!commit || !git('ls-tree', '--name-only', commit, '--', changelogPath))
    return []

  return listEntries(git('show', `${commit}:${changelogPath}`))
}

function hasRequiredFields(entry) {
  return fieldNames.every((field) => {
    const label = `- **${field}**：`
    return entry.split('\n').some(line => line.startsWith(label) && line.slice(label.length).trim())
  })
}

function checkChangelog({ base, head }) {
  const paths = (base
    ? git('diff', '--name-only', '--no-renames', '-z', base, head, '--')
    : git('ls-tree', '-r', '--name-only', '-z', head)).split('\0').filter(Boolean)

  if (paths.length === 0) {
    console.log('所比较的提交没有文件变化。')
    return
  }

  const entries = readEntries(head)
  if (!entries.length || !hasRequiredFields(entries[0]))
    throw new Error(`${changelogPath} 缺少完整的首条记录，请填写日期、类别、范围、摘要和验证。`)

  if (paths.some(path => path !== changelogPath)) {
    const previousEntries = readEntries(base)
    const previousFirst = previousEntries[0]

    if (previousFirst !== undefined) {
      const boundary = entries.indexOf(previousFirst)
      const existing = new Set(previousEntries)
      const prepended = entries.slice(0, boundary)

      if (boundary < 1 || prepended.some(entry => existing.has(entry) || !hasRequiredFields(entry))) {
        throw new Error(
          `本次改动须在 ${changelogPath} 顶部新增完整记录，并保留原首条记录。`,
        )
      }
    }
  }

  console.log(`${changelogPath} 检查通过。`)
}

try {
  const range = comparisonRange(process.argv.slice(2))
  if (range)
    checkChangelog(range)
}
catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
