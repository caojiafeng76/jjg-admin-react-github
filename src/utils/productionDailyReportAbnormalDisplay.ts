interface ProductionDailyReportAbnormalDisplayRow {
  readonly remark: string
  readonly outsourceDefectReason: string
}

interface ProductionDailyReportAbnormalDisplays {
  readonly rawMaterialDefect: string
  readonly processingDefect: string
  readonly outsourceDefect: string
}

const RAW_MATERIAL_DEFECT_KEYWORDS = ['原料', '接头印', '有伤', '变形'] as const

const PROCESSING_DEFECT_KEYWORDS = [
  '加工坏',
  '倒角大',
  '铣坏',
  '铣脱',
  '开口小',
  '尺寸不对',
] as const

function joinUniqueValues(values: readonly string[]): string {
  const normalizedValues = values
    .map((value) => value.trim())
    .filter((value) => value && value !== '-')

  return Array.from(new Set(normalizedValues)).join('、')
}

function splitRemarkSegments(remark: string): string[] {
  return remark
    .replace(/<br\s*\/?>/gi, '\n')
    .split(/[，,、\r\n；;。]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment !== '-')
}

function joinRemarkSegmentsByKeywords(
  rows: readonly ProductionDailyReportAbnormalDisplayRow[],
  keywords: readonly string[],
): string {
  return joinUniqueValues(
    rows.flatMap((row) =>
      splitRemarkSegments(row.remark).filter((segment) =>
        keywords.some((keyword) => segment.includes(keyword)),
      ),
    ),
  )
}

export function buildProductionDailyReportAbnormalDisplays(
  rows: readonly ProductionDailyReportAbnormalDisplayRow[],
): ProductionDailyReportAbnormalDisplays {
  return {
    rawMaterialDefect: joinRemarkSegmentsByKeywords(
      rows,
      RAW_MATERIAL_DEFECT_KEYWORDS,
    ),
    processingDefect: joinRemarkSegmentsByKeywords(
      rows,
      PROCESSING_DEFECT_KEYWORDS,
    ),
    outsourceDefect: joinUniqueValues(
      rows.map((row) => row.outsourceDefectReason),
    ),
  }
}
