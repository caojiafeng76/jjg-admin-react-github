import { fetchSyneyStoreReportFromScm } from '@/services/apiSyneyStoreReports'
import { useMutation } from '@tanstack/react-query'

export function useFetchSyneyStoreReport() {
  // 保留原始 useMutation 而非 useMutationWithMessage：本操作为只读的
  // 「从 SCM 拉取入库单数据」（fetchSyneyStoreReportFromScm），不写入数据、
  // 无缓存失效需求；成功/失败提示由调用方（index.tsx 的 handleFetchStoreReport）
  // 按业务分支定制（空数据、规格加载中、payload 构建失败等），不适用
  // useMutationWithMessage 的「自动失效 + 自动提示」语义。
  const { mutate: fetchSyneyStoreReport, isPending: isFetching } = useMutation({
    mutationFn: fetchSyneyStoreReportFromScm,
  })

  return { fetchSyneyStoreReport, isFetching }
}
