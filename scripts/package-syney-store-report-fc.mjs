#!/usr/bin/env node

import { chmod, copyFile, mkdir, stat } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptPath = fileURLToPath(import.meta.url)
const repoRoot = resolve(dirname(scriptPath), '..')
const functionRoot = resolve(repoRoot, 'aliyun-fc/syney-store-report')
const defaultOutputDir = resolve(repoRoot, 'dist/aliyun-fc/syney-store-report')

const REQUIRED_FILES = [
  'server.js',
  'proxy-security.js',
  'package.json',
  'bootstrap',
  'README.md',
]

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

export async function stageSyneyStoreReportFcPackage({
  outputDir = defaultOutputDir,
} = {}) {
  const copiedFiles = []

  await mkdir(outputDir, { recursive: true })

  for (const file of REQUIRED_FILES) {
    const sourcePath = resolve(functionRoot, file)
    const targetPath = resolve(outputDir, file)

    await assertFileExists(sourcePath)
    await mkdir(dirname(targetPath), { recursive: true })
    await copyFile(sourcePath, targetPath)

    if (file === 'bootstrap') {
      await chmod(targetPath, 0o755)
    }

    copiedFiles.push(file)
  }

  return copiedFiles
}

async function main() {
  const { outputDir } = parseArgs(process.argv.slice(2))
  const copiedFiles = await stageSyneyStoreReportFcPackage({ outputDir })

  console.log(`Staged Syney store report FC package: ${toDisplayPath(outputDir)}`)
  for (const file of copiedFiles) {
    console.log(`- ${file}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
