import { useQuery } from '@tanstack/react-query'
import { queryConfig } from '@/config/queryClient'
import { getWorkshopMiscMaterialsCategories } from '@/services/apiWorkshopMiscMaterialsData'
import { workshopMiscMaterialsKeys } from './queryKeys'

/** 获取历史已填类别清单，供新建/编辑材料与筛选栏联想使用 */
export function useWorkshopMiscMaterialsCategories() {
  return useQuery({
    queryKey: workshopMiscMaterialsKeys.categories.all,
    queryFn: getWorkshopMiscMaterialsCategories,
    throwOnError: false,
    ...queryConfig.list,
  })
}
