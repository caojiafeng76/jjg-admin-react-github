/**
 * PDF/Excel 辅助工具
 *
 * jsdom 环境不支持 Intl.NumberFormat，单元测试中请 mock。
 */
export function formatNumber(num: number) {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(num)
    .padStart(10)
}
