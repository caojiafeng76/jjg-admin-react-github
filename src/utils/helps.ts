export function formatNumber(num: number) {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(num)
    .padStart(10)
}
