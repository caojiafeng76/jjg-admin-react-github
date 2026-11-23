import JSZip from 'jszip'

export interface ExcelPrintMargins {
  left: number
  right: number
  top: number
  bottom: number
  header: number
  footer: number
}

export interface ExcelPrintSetupOptions {
  /** ECMA-376 纸张代码，9 = A4 */
  paperSize?: number
  orientation?: 'portrait' | 'landscape'
  /** 打印缩放比例（10~400），默认不写入 */
  scale?: number
  margins?: ExcelPrintMargins
  horizontalCentered?: boolean
  verticalCentered?: boolean
  /** 目标工作表在 xlsx 压缩包内的路径，默认 xl/worksheets/sheet1.xml */
  sheetPath?: string
}

const DEFAULT_SHEET_PATH = 'xl/worksheets/sheet1.xml'

const PRINT_OPTIONS_TAG_PATTERN
  = /<(?:\w+:)?printOptions\b[^>]*\/>|<(?:\w+:)?printOptions\b[^>]*>[\s\S]*?<\/(?:\w+:)?printOptions>/g
const PAGE_MARGINS_TAG_PATTERN
  = /<(?:\w+:)?pageMargins\b[^>]*\/>|<(?:\w+:)?pageMargins\b[^>]*>[\s\S]*?<\/(?:\w+:)?pageMargins>/g
const PAGE_SETUP_TAG_PATTERN
  = /<(?:\w+:)?pageSetup\b[^>]*\/>|<(?:\w+:)?pageSetup\b[^>]*>[\s\S]*?<\/(?:\w+:)?pageSetup>/g

/**
 * ECMA-376 CT_Worksheet 中位于 printOptions / pageMargins / pageSetup 之后的节点。
 * 保持规范子元素顺序，避免 Excel 打开时触发内容修复提示。
 */
const TRAILING_WORKSHEET_TAG_PATTERN
  = /<(?:\w+:)?(?:headerFooter|rowBreaks|colBreaks|customProperties|cellWatches|ignoredErrors|smartTags|drawing|drawingHF|legacyDrawing|legacyDrawingHF|picture|oleObjects|controls|webPublishItems|tableParts|extLst)\b|<\/(?:\w+:)?worksheet>/

function serializeAttributes(
  attributes: Array<[string, string | number | undefined]>,
): string {
  return attributes
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ')
}

function buildPrintOptionsXml(options: ExcelPrintSetupOptions): string {
  const attrs = serializeAttributes([
    ['horizontalCentered', options.horizontalCentered ? '1' : undefined],
    ['verticalCentered', options.verticalCentered ? '1' : undefined],
  ])
  return attrs ? `<printOptions ${attrs}/>` : ''
}

function buildPageMarginsXml(margins?: ExcelPrintMargins): string {
  if (!margins) {
    return ''
  }

  const attrs = serializeAttributes([
    ['left', margins.left],
    ['right', margins.right],
    ['top', margins.top],
    ['bottom', margins.bottom],
    ['header', margins.header],
    ['footer', margins.footer],
  ])
  return `<pageMargins ${attrs}/>`
}

function buildPageSetupXml(options: ExcelPrintSetupOptions): string {
  const attrs = serializeAttributes([
    ['paperSize', options.paperSize],
    ['scale', options.scale],
    ['orientation', options.orientation],
  ])
  return attrs ? `<pageSetup ${attrs}/>` : ''
}

/**
 * 向工作表 XML 注入 printOptions / pageMargins / pageSetup 配置，并清理旧节点以保证幂等。
 */
export function injectWorksheetPrintSetupXml(
  worksheetXml: string,
  options: ExcelPrintSetupOptions,
): string {
  const printOptionsXml = buildPrintOptionsXml(options)
  const pageMarginsXml = buildPageMarginsXml(options.margins)
  const pageSetupXml = buildPageSetupXml(options)
  const injectedXml = `${printOptionsXml}${pageMarginsXml}${pageSetupXml}`

  if (!injectedXml) {
    return worksheetXml
  }

  const cleanedXml = worksheetXml
    .replace(PRINT_OPTIONS_TAG_PATTERN, '')
    .replace(PAGE_MARGINS_TAG_PATTERN, '')
    .replace(PAGE_SETUP_TAG_PATTERN, '')

  const match = TRAILING_WORKSHEET_TAG_PATTERN.exec(cleanedXml)
  if (!match || match.index === undefined) {
    throw new Error('工作表 XML 缺少结束标签 </worksheet>')
  }

  return (
    cleanedXml.slice(0, match.index)
    + injectedXml
    + cleanedXml.slice(match.index)
  )
}

/**
 * 为已生成的 xlsx 二进制缓冲区写入页面打印设置与页边距。
 */
export async function applyExcelPrintSetup(
  workbookBuffer: ArrayBuffer,
  options: ExcelPrintSetupOptions,
): Promise<ArrayBuffer> {
  const sheetPath = options.sheetPath ?? DEFAULT_SHEET_PATH
  const zip = await JSZip.loadAsync(workbookBuffer)
  const sheetFile = zip.file(sheetPath)

  if (!sheetFile) {
    throw new Error(`未在工作簿中找到工作表文件：${sheetPath}`)
  }

  const worksheetXml = await sheetFile.async('string')
  const updatedXml = injectWorksheetPrintSetupXml(worksheetXml, options)
  zip.file(sheetPath, updatedXml)

  return zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
  })
}
