/** 金檀配件/型材颜色：自由文本、选填，空字符串表示未填 */

export const JINTAN_COLOR_MAX_LENGTH = 50

/** 表格、详情里显示的颜色，未填显示「-」 */
export function formatJintanColor(color: string | null | undefined): string {
  return color?.trim() || '-'
}

/** 拼进提示文案的颜色片段，未填时为空，如：颜色“红” */
export function describeJintanColor(color: string | null | undefined): string {
  const text = color?.trim() ?? ''
  return text ? `颜色“${text}”` : ''
}

/** 拼进下拉选项等 “A / 名称 / 规格” 文本的颜色段，未填时为空，如：“ / 红” */
export function jintanColorSegment(color: string | null | undefined): string {
  const text = color?.trim() ?? ''
  return text ? ` / ${text}` : ''
}
