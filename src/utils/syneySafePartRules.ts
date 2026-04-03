export type SyneySafePartRule = {
  part_no: string
  name?: string | null
  part_model?: string | null
  part_code_prefix?: string | null
  english_name?: string | null
  need_print_label?: boolean
  is_safe_part?: boolean
}

function normalizePartNo(partNo: string) {
  return partNo.trim().replace(/^[^A-Za-z0-9]+/, '')
}

function getSortedRules(settings: SyneySafePartRule[] = []) {
  return [...settings].sort(
    (left, right) => right.part_no.length - left.part_no.length,
  )
}

export function findSafePartRule(
  partNo: string | null | undefined,
  settings: SyneySafePartRule[] | undefined,
  predicate?: (rule: SyneySafePartRule) => boolean,
) {
  if (!partNo || !settings?.length) {
    return null
  }

  const normalizedPartNo = normalizePartNo(partNo)

  return (
    getSortedRules(settings).find((rule) => {
      if (!rule.part_no) {
        return false
      }

      return (
        normalizedPartNo.includes(normalizePartNo(rule.part_no)) &&
        (!predicate || predicate(rule))
      )
    }) ?? null
  )
}

export function isSafePartBySettings(
  partNo: string | null | undefined,
  settings: SyneySafePartRule[] | undefined,
) {
  return Boolean(findSafePartRule(partNo, settings, (rule) => !!rule.is_safe_part))
}

export function getLabelInfoBySettings(
  partNo: string | null | undefined,
  serialNo: string | number,
  settings: SyneySafePartRule[] | undefined,
) {
  const matchedRule = findSafePartRule(
    partNo,
    settings,
    (rule) => !!rule.need_print_label,
  )

  if (!matchedRule?.name || !matchedRule?.part_model || !matchedRule?.part_code_prefix) {
    return null
  }

  return {
    rule: matchedRule,
    partName2: matchedRule.name,
    partModel: matchedRule.part_model,
    partCode: `${matchedRule.part_code_prefix}${serialNo}`,
    englishPartName: matchedRule.english_name ?? '',
  }
}

export function getLabelInfoFromStoredItem(
  item: {
    PartName2?: string | null
    PartModel?: string | null
    PartCode?: string | null
  },
  settings?: SyneySafePartRule[],
) {
  if (!item.PartName2 || !item.PartModel || !item.PartCode) {
    return null
  }

  const englishPartName =
    settings?.find((r) => r.name === item.PartName2)?.english_name ?? ''

  return {
    partName2: item.PartName2,
    partModel: item.PartModel,
    partCode: item.PartCode,
    englishPartName,
  }
}