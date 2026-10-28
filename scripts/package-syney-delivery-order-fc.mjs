#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { chmod, copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(scriptPath), '..')
const functionRoot = resolve(repoRoot, 'aliyun-fc/syney-delivery-order')
const entryFile = resolve(repoRoot, 'server/syneyDeliveryOrderFcServer.ts')
const defaultOutputDir = resolve(repoRoot, 'dist/aliyun-fc/syney-delivery-order')

const STATIC_FILES = ['package.json', 'bootstrap', 'README.md']

function toDisplayPath(path) {
  return path.replaceAll('\\', '/')
}

function parseArgs(args) {
  const options = {
    outputDir: defaultOutputDir,
  }

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--out') {
      const outputDir = args[index + 1]

      if (!outputDir) {
        throw new Error('Missing value for --out')
      }

      options.outputDir = isAbsolute(outputDir)
        ? outputDir
        : resolve(repoRoot, outputDir)
      index += 1
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

async function assertFileExists(path) {
  const fileStat = await stat(path)

  if (!fileStat.isFile()) {
    throw new Error(`Expected file but found something else: ${path}`)
  }
}

/**
 * 业务逻辑只维护 server/ 下的 TypeScript 一份，由 bun build 打成单文件 CommonJS，
 * 避免再手抄一份 JS（入库单 FC 曾因此出现实现漂移）。
 */
function bundleServer(outputDir) {
  const result = spawnSync(
    'bun',
    [
      'build',
      entryFile,
      '--target=node',
      '--format=cjs',
      `--outfile=${resolve(outputDir, 'server.js')}`,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  )

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'bun build failed')
  }
}

export async function stageSyneyDeliveryOrderFcPackage({
  outputDir = defaultOutputDir,
} = {}) {
  const stagedFiles = []

  await mkdir(outputDir, { recursive: true })
  bundleServer(outputDir)
  stagedFiles.push('server.js')

  for (const file of STATIC_FILES) {
    const sourcePath = resolve(functionRoot, file)
    const targetPath = resolve(outputDir, file)

    await assertFileExists(sourcePath)
    await copyFile(sourcePath, targetPath)

    if (file === 'bootstrap') {
      await chmod(targetPath, 0o755)
    }

    stagedFiles.push(file)
  }

  return stagedFiles
}

async function main() {
  const { outputDir } = parseArgs(process.argv.slice(2))
  const stagedFiles = await stageSyneyDeliveryOrderFcPackage({ outputDir })

  console.log(`Staged Syney delivery order FC package: ${toDisplayPath(outputDir)}`)
  for (const file of stagedFiles) {
    console.log(`- ${file}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
