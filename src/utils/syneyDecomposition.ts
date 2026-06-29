import type { ISyneyItem } from '@/services/types'
import {
  findSafePartRule,
  hasDownFlag,
  hasUpFlag,
  type DecompositionRole,
  type SyneySafePartRule,
} from './syneySafePartRules'

export type DecompositionCell = {
  spec: string
  qty: number
}

export type DecompositionCells = {
  frontPlate?: DecompositionCell
  upperMiddle?: DecompositionCell
  lowerMiddle?: DecompositionCell
  rearUpper?: DecompositionCell
  rearLower?: DecompositionCell
  extensionUpper?: DecompositionCell
  extensionLower?: DecompositionCell
}

type CellKey = keyof DecompositionCells

const ROLE_TO_CELL_KEY: Partial<Record<DecompositionRole, CellKey>> = {
  front_plate: 'frontPlate',
  upper_middle: 'upperMiddle',
  lower_middle: 'lowerMiddle',
  rear_upper: 'rearUpper',
  rear_lower: 'rearLower',
  extension_upper: 'extensionUpper',
  extension_lower: 'extensionLower',
}

function normalizePartNo(partNo: string | null | undefined) {
  return (partNo || '').trim().replace(/^[^A-Za-z0-9]+/, '')
}

function startsWithAny(value: string, prefixes: string[]) {
  return prefixes.some((prefix) => value.startsWith(prefix))
}

function getConfiguredCellKey(
  item: ISyneyItem,
  settings: SyneySafePartRule[] | undefined,
) {
  const rule = findSafePartRule(
    item.PartNo,
    settings,
    (candidate) => !!candidate.decomposition_role,
  )
  const role = rule?.decomposition_role as DecompositionRole | undefined

  return role ? ROLE_TO_CELL_KEY[role] : undefined
}

function getLegacyCellKey(item: ISyneyItem): CellKey | undefined {
  const partNo = normalizePartNo(item.PartNo)
  const remark = item.Remark || ''

  if (startsWithAny(partNo, ['XN2808EB', 'XN3024BR'])) {
    return 'frontPlate'
  }

  if (
    startsWithAny(partNo, [
      'XN2808BP',
      'XN3024BS',
      'XN2808JY',
      'XN3024DF',
      'XN3024AP',
    ])
  ) {
    return 'upperMiddle'
  }

  if (
    startsWithAny(partNo, [
      'XN2808BQ',
      'XN3024BT',
      'XN2808JZ',
      'XN3024DG',
      'XN3024AQ',
    ])
  ) {
    return 'lowerMiddle'
  }

  if (partNo.startsWith('XN3024BX')) {
    return 'rearUpper'
  }

  if (partNo.startsWith('XN3024BY')) {
    return 'rearLower'
  }

  if (
    (partNo.startsWith('XN2808AL') && remark.includes('上头部')) ||
    (partNo.startsWith('XN3024X997') &&
      (hasUpFlag(remark) || !hasDownFlag(remark)))
  ) {
    return 'extensionUpper'
  }

  if (
    (partNo.startsWith('XN2808AL') && remark.includes('下头部')) ||
    (partNo.startsWith('XN3024X997') && hasDownFlag(remark))
  ) {
    return 'extensionLower'
  }

  return undefined
}

function isLegacyRearPlateCandidate(item: ISyneyItem) {
  const partNo = normalizePartNo(item.PartNo)
  return partNo.startsWith('XN2808AF') || partNo.startsWith('XN3024Y997')
}

function getLegacyRearCellKey(item: ISyneyItem): CellKey | undefined {
  const remark = item.Remark || ''
  const isUp = hasUpFlag(remark)
  const isDown = hasDownFlag(remark)

  if (isUp && !isDown) return 'rearUpper'
  if (isDown && !isUp) return 'rearLower'

  return undefined
}

function addCell(
  cells: DecompositionCells,
  key: CellKey,
  item: ISyneyItem,
  qtyOverride?: number,
) {
  const spec = item.ParamSpec || ''
  const qty = qtyOverride ?? item.Qty ?? 0

  if (qty <= 0 || !spec) {
    return
  }

  const existing = cells[key]
  if (existing && existing.spec === spec) {
    existing.qty += qty
    return
  }

  cells[key] = { spec, qty }
}

export function buildDecompositionCells(
  items: ISyneyItem[],
  settings?: SyneySafePartRule[],
): DecompositionCells {
  const cells: DecompositionCells = {}
  const unassignedRearItems: ISyneyItem[] = []

  items.forEach((item) => {
    const configuredKey = getConfiguredCellKey(item, settings)
    if (configuredKey) {
      addCell(cells, configuredKey, item)
      return
    }

    const legacyKey = getLegacyCellKey(item)
    if (legacyKey) {
      addCell(cells, legacyKey, item)
      return
    }

    if (isLegacyRearPlateCandidate(item)) {
      const rearKey = getLegacyRearCellKey(item)
      if (rearKey) {
        addCell(cells, rearKey, item)
      } else {
        unassignedRearItems.push(item)
      }
    }
  })

  if (unassignedRearItems.length === 1) {
    const item = unassignedRearItems[0]
    addCell(cells, 'rearUpper', item, 1)
    addCell(cells, 'rearLower', item, 1)
  } else if (unassignedRearItems.length >= 2) {
    addCell(cells, 'rearUpper', unassignedRearItems[0])
    addCell(cells, 'rearLower', unassignedRearItems[1])
  }

  return cells
}
