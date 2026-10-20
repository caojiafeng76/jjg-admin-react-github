import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// .agents/skills 是 skills 安装器（skills-lock.json）的落盘目录，供 Codex / openskills 读取；
// .claude/skills 供 Claude Code 读取。本机通常是指向 .agents/skills 的目录链接，但 git 里是两份
// 普通文件（Windows 默认 core.symlinks=false），其他检出环境需要靠本脚本保持一致
export const SKILLS_SOURCE_DIR = '.agents/skills'
export const SKILLS_MIRROR_DIRS = ['.claude/skills']

function listFiles(root) {
  if (!existsSync(root))
    return []

  const files = []
  const walk = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const fullPath = join(directory, entry.name)
      if (entry.isDirectory())
        walk(fullPath)
      else
        files.push(relative(root, fullPath).replaceAll('\\', '/'))
    }
  }
  walk(root)
  return files.sort()
}

/**
 * 比较来源目录与镜像目录，返回差异文件的相对路径
 * @param {string} sourceDir 来源目录（绝对路径）
 * @param {string} mirrorDir 镜像目录（绝对路径）
 * @returns {{ missing: string[], extra: string[], changed: string[] }} 镜像缺少、多出、内容不同的文件
 */
export function diffSkillDirs(sourceDir, mirrorDir) {
  const sourceFiles = listFiles(sourceDir)
  const mirrorFiles = listFiles(mirrorDir)
  const mirrorSet = new Set(mirrorFiles)
  const sourceSet = new Set(sourceFiles)

  return {
    missing: sourceFiles.filter(file => !mirrorSet.has(file)),
    extra: mirrorFiles.filter(file => !sourceSet.has(file)),
    changed: sourceFiles.filter(
      file =>
        mirrorSet.has(file)
        && !readFileSync(join(sourceDir, file)).equals(
          readFileSync(join(mirrorDir, file)),
        ),
    ),
  }
}

function isSameDirectory(sourceDir, mirrorDir) {
  return existsSync(mirrorDir) && realpathSync(sourceDir) === realpathSync(mirrorDir)
}

function syncSkillDir(sourceDir, mirrorDir) {
  if (isSameDirectory(sourceDir, mirrorDir))
    return { linked: true, missing: [], extra: [], changed: [] }

  const { missing, extra, changed } = diffSkillDirs(sourceDir, mirrorDir)

  for (const file of extra)
    rmSync(join(mirrorDir, file))

  for (const file of [...missing, ...changed]) {
    const target = join(mirrorDir, file)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(join(sourceDir, file), target)
  }

  return { linked: false, missing, extra, changed }
}

const isDirectRun
  = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  const root = process.cwd()
  const sourceDir = resolve(root, SKILLS_SOURCE_DIR)
  if (!existsSync(sourceDir)) {
    console.error(`未找到 ${SKILLS_SOURCE_DIR}`)
    process.exit(1)
  }

  for (const mirror of SKILLS_MIRROR_DIRS) {
    const { linked, missing, extra, changed } = syncSkillDir(
      sourceDir,
      resolve(root, mirror),
    )
    const total = missing.length + extra.length + changed.length
    console.log(
      linked
        ? `${mirror} 是指向 ${SKILLS_SOURCE_DIR} 的链接，无需同步`
        : total === 0
          ? `${mirror} 已与 ${SKILLS_SOURCE_DIR} 一致`
          : `${mirror}：新增 ${missing.length}，更新 ${changed.length}，删除 ${extra.length}`,
    )
  }
}
