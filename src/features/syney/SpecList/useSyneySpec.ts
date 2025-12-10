import { useQuery } from '@tanstack/react-query'

import { getSyneySpec } from '@services/apiSyneySpecs'
import { queryConfig } from '@/config/queryClient'

export function useSyneySpec(id: string) {
  const {
    isLoading: specLoading,
    data: spec,
    error: specError,
  } = useQuery({
    queryKey: ['spec', id],
    queryFn: () => getSyneySpec(Number(id)),
    enabled: !!id,
    ...queryConfig.detail,
  })

  return {
    specLoading,
    spec,
    specError,
  }
}
