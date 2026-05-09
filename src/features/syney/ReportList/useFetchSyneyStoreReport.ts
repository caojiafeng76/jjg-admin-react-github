import { fetchSyneyStoreReportFromScm } from '@/services/apiSyneyStoreReports'
import { useMutation } from '@tanstack/react-query'

export function useFetchSyneyStoreReport() {
  const { mutate: fetchSyneyStoreReport, isPending: isFetching } = useMutation({
    mutationFn: fetchSyneyStoreReportFromScm,
  })

  return { fetchSyneyStoreReport, isFetching }
}
