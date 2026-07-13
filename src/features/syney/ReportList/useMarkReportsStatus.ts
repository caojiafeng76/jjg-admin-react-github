import { App } from 'antd'

import { useAppStore } from '@/store'
import { updateSyneyStoreReports } from '@/services/apiSyneyStoreReports'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'

type ReportStatus = 'confirmed' | 'unconfirmed'

/**
 * 统一处理对账单状态更新的 Hook
 * - 内置空选择提示
 * - 统一成功/失败提示
 * - 自动失效列表缓存并清空选中项
 */
export function useMarkReportsStatus() {
  const { message } = App.useApp()
  const setTableSelectedKeys = useAppStore(
    (state) => state.setTableSelectedKeys,
  )

  const { mutate: mark, isPending } = useMutationWithMessage({
    mutationFn: updateSyneyStoreReports,
    invalidateQueries: [['syney-reports']],
    successMessage: (_data, variables) =>
      variables.Status === 'confirmed' ? '标记已校对成功' : '标记未校对成功',
    errorMessage: '标记失败，请稍后重试',
    onSuccess: () => {
      // 成功后清空选择
      setTableSelectedKeys([])
    },
  })

  const markStatus = (Nos: string[], Status: ReportStatus) => {
    if (!Nos.length) {
      const tip =
        Status === 'confirmed'
          ? '请选择要标记已校对的条目'
          : '请选择要标记未校对的条目'
      message.warning(tip)
      return
    }
    mark({ Nos, Status })
  }

  return {
    markStatus,
    isPending,
  }
}

