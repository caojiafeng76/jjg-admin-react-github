export const DECOMPOSITION_ROLE_LABELS: Record<string, string> = {
  side_frame: '侧围',
  cross_frame: '横围',
  front_plate: '前板',
  upper_middle: '上中板',
  lower_middle: '下中板',
  rear_upper: '上后板',
  rear_lower: '下后板',
  extension_upper: '上加长板',
  extension_lower: '下加长板',
}

export const DECOMPOSITION_ROLE_OPTIONS = Object.entries(
  DECOMPOSITION_ROLE_LABELS,
).map(([value, label]) => ({ value, label }))

export interface SafePartLabelPreset {
  part_model: string
  part_code_prefix: string
  english_name: string
}

// 按名称索引的标签模板字段，选择名称时自动带出
export const SAFE_PART_LABEL_PRESETS: Record<string, SafePartLabelPreset> = {
  梳齿支撑板: {
    part_model: 'YD1001XN',
    part_code_prefix: 'ZC00',
    english_name: 'COMB PLATE',
  },
  楼层板: {
    part_model: 'YD0201XN',
    part_code_prefix: 'LC00',
    english_name: 'COVER PLATE',
  },
}

function presetOptions(field: keyof SafePartLabelPreset) {
  return Object.values(SAFE_PART_LABEL_PRESETS).map(preset => ({
    value: preset[field],
    label: preset[field],
  }))
}

export const PART_MODEL_OPTIONS = presetOptions('part_model')
export const PART_CODE_PREFIX_OPTIONS = presetOptions('part_code_prefix')
export const ENGLISH_NAME_OPTIONS = presetOptions('english_name')
