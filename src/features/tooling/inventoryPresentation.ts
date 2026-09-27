/**
 * 刀具库存展示口径
 *
 * 最终库存颜色阈值同时被刀具库存列表页与刀具资料行详情抽屉复用，
 * 统一放在此处避免两处阈值漂移。
 */
export function getFinalStockColorClass(value: number | null | undefined) {
  const stock = Number(value ?? 0)

  if (stock < 5) return 'text-red-600'
  if (stock < 10) return 'text-yellow-600'
  if (stock < 20) return 'text-orange-600'
  return 'text-green-600'
}
