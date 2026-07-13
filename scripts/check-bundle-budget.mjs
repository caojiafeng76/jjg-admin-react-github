import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const ENTRY_GZIP_LIMIT_BYTES = 600 * 1024
const HEAVY_DOCUMENT_PATTERN = /(?:pdf|xlsx|excel|jspdf|html2canvas)/i
const DOCUMENT_ACTION_PATTERN =
  /(?:pdf|xlsx|excel|document|workbook|export|print)/i
const EAGER_HEAVY_DOCUMENT_PATTERN =
  /(?:jspdf|html2canvas|xlsx(?:\.min)?|pdfdocument|exceldocument|workbook)/i
const distDirectory = resolve(
  process.env.BUNDLE_BUDGET_DIST_DIR ?? resolve(process.cwd(), 'dist'),
)
const manifestPath = resolve(distDirectory, '.vite/manifest.json')
const indexPath = resolve(distDirectory, 'index.html')

if (!existsSync(manifestPath) || !existsSync(indexPath)) {
  throw new Error('未找到构建产物，请先运行 bun run build')
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const entries = Object.entries(manifest).filter(([, chunk]) => chunk.isEntry)

if (entries.length === 0) {
  throw new Error('Vite manifest 中未找到入口文件')
}

function chunkDescription(key, chunk) {
  return [key, chunk.src, chunk.name, chunk.file].filter(Boolean).join(' | ')
}

function isHeavyDocumentChunk(key, chunk) {
  return HEAVY_DOCUMENT_PATTERN.test(chunkDescription(key, chunk))
}

function isDocumentActionChunk(key, chunk) {
  return DOCUMENT_ACTION_PATTERN.test(chunkDescription(key, chunk))
}

function isEagerHeavyDocumentChunk(key, chunk) {
  return EAGER_HEAVY_DOCUMENT_PATTERN.test(chunkDescription(key, chunk))
}

function collectStaticGraph(entryKey) {
  const visited = new Set()
  const pending = [entryKey]

  while (pending.length > 0) {
    const key = pending.pop()
    if (!key || visited.has(key)) continue

    const chunk = manifest[key]
    if (!chunk) {
      throw new Error(`Vite manifest 缺少静态依赖记录：${key}`)
    }

    visited.add(key)
    pending.push(...(chunk.imports ?? []))
  }

  return visited
}

function readTagAttribute(tag, attribute) {
  const match = tag.match(
    new RegExp(
      `\\b${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      'i',
    ),
  )
  return match?.[1] ?? match?.[2] ?? match?.[3]
}

function normalizeAssetPath(reference) {
  try {
    return new URL(reference, 'https://bundle.local').pathname.replace(
      /^\/+/,
      '',
    )
  } catch {
    return reference.split(/[?#]/, 1)[0].replace(/^\/+/, '')
  }
}

function resolveManifestChunk(reference) {
  const assetPath = normalizeAssetPath(reference)
  return Object.entries(manifest).find(([, chunk]) => {
    const chunkPath = chunk.file?.replace(/^\/+/, '')
    return (
      chunkPath &&
      (assetPath === chunkPath || assetPath.endsWith(`/${chunkPath}`))
    )
  })
}

const entrySummaries = []
const heavyStaticDependencies = []
const heavyLazyPageDependencies = []

for (const [entryKey, entry] of entries) {
  if (!entry.file) {
    throw new Error(`Vite manifest 入口缺少输出文件：${entryKey}`)
  }

  const entrySource = readFileSync(resolve(distDirectory, entry.file))
  const entryGzipBytes = gzipSync(entrySource).byteLength
  entrySummaries.push(
    `${entry.file} gzip ${(entryGzipBytes / 1024).toFixed(1)} KB`,
  )

  if (entryGzipBytes > ENTRY_GZIP_LIMIT_BYTES) {
    throw new Error(
      `入口 ${entry.file} JS gzip ${(entryGzipBytes / 1024).toFixed(1)} KB，超过 600 KB 门槛`,
    )
  }

  for (const chunkKey of collectStaticGraph(entryKey)) {
    const chunk = manifest[chunkKey]
    if (isHeavyDocumentChunk(chunkKey, chunk)) {
      heavyStaticDependencies.push(
        `${entryKey} -> ${chunkDescription(chunkKey, chunk)}`,
      )
    }
  }
}

if (heavyStaticDependencies.length > 0) {
  throw new Error(
    `入口静态依赖图不应包含 PDF/XLSX 模块：${heavyStaticDependencies.join(', ')}`,
  )
}

const lazyPageEntries = Object.entries(manifest).filter(
  ([key, chunk]) =>
    chunk.isDynamicEntry &&
    !isDocumentActionChunk(key, chunk) &&
    !isEagerHeavyDocumentChunk(key, chunk),
)

for (const [entryKey] of lazyPageEntries) {
  for (const chunkKey of collectStaticGraph(entryKey)) {
    const chunk = manifest[chunkKey]
    if (isEagerHeavyDocumentChunk(chunkKey, chunk)) {
      heavyLazyPageDependencies.push(
        `${entryKey} -> ${chunkDescription(chunkKey, chunk)}`,
      )
    }
  }
}

if (heavyLazyPageDependencies.length > 0) {
  throw new Error(
    `动态页面静态依赖图不应包含 PDF/XLSX 模块：${heavyLazyPageDependencies.join(', ')}`,
  )
}

const indexHtml = readFileSync(indexPath, 'utf8')
const preloadTags = (indexHtml.match(/<link\b[^>]*>/gi) ?? []).filter((tag) => {
  const rel = readTagAttribute(tag, 'rel')
  return rel
    ?.split(/\s+/)
    .some((value) => ['modulepreload', 'preload'].includes(value.toLowerCase()))
})
const heavyPreloads = preloadTags.flatMap((tag) => {
  const href = readTagAttribute(tag, 'href')
  if (!href) return []

  const manifestChunk = resolveManifestChunk(href)
  if (manifestChunk) {
    const [key, chunk] = manifestChunk
    return isHeavyDocumentChunk(key, chunk)
      ? [chunkDescription(key, chunk)]
      : []
  }

  return HEAVY_DOCUMENT_PATTERN.test(href) ? [href] : []
})

if (heavyPreloads.length > 0) {
  throw new Error(
    `index.html 不应静态预加载 PDF/XLSX 模块：${heavyPreloads.join(', ')}`,
  )
}

console.log(`Bundle budget passed: ${entrySummaries.join('; ')}`)
