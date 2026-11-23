import { useQuery } from '@tanstack/react-query'

import { queryConfig } from '@/config/queryClient'
import { getSyneySafePartSettings } from '@/services/apiSyneySafePartSettings'
import { syneyKeys } from './queryKeys'

/**
 * 安全部件设置查询（静态数据，1 小时缓存）。
 * 设置变更时由 SafePartSettingPage 的 mutation 通过 invalidateQueries 驱动刷新，
 * 无需轮询。
 */
export function useSyneySafePartSettings() {
  return useQuery({
    queryKey: syneyKeys.safePartSettings.all,
    queryFn: ({ signal }) => getSyneySafePartSettings(signal),
    ...queryConfig.static,
  })
}
