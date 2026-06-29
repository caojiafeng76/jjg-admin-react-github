import { pinyin } from 'pinyin-pro'

function normalizeKeyword(value: string): string {
  return value.trim().toLowerCase()
}

function buildPinyinInitials(value: string): string {
  return pinyin(value, {
    toneType: 'none',
    type: 'array',
  })
    .map((item) => item[0] || '')
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function buildToolingOptionKeywords(
  values: Array<string | null | undefined>,
): string {
  const keywords = values.flatMap((value) => {
    const rawValue = String(value || '').trim()

    if (!rawValue) {
      return []
    }

    return [rawValue, buildPinyinInitials(rawValue)]
  })

  return Array.from(new Set(keywords)).join(' ')
}

export function matchesToolingOptionKeyword(
  input: string,
  keywords: string,
): boolean {
  const keyword = normalizeKeyword(input)

  if (!keyword) {
    return true
  }

  return normalizeKeyword(keywords).includes(keyword)
}
