import { useQuery } from '@tanstack/react-query'

import { getSyneySpec } from '@services/apiSyneySpecs'

export function useSyneySpec(id: string) {
  const {
    isLoading: specLoading,
    data: spec,
    error: specError,
  } = useQuery({
    queryKey: ['spec'],
    queryFn: () => getSyneySpec(Number(id)),
  })

  return {
    specLoading,
    spec,
    specError,
  }
}
