import { App } from 'antd'

import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import { updateSyneyStoreReports } from '@/services/apiSyneyStoreReports'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useTableSelection } from '../useTableSelection'

type ReportStatus = 'confirmed' | 'unconfirmed'

/**
 * 统一处理对账单状态更新的 Hook
 * - 内置空选择提示
 * - 统一成功/失败提示
 * - 自动失效列表缓存并清空选中项
 */
export function useMarkReportsStatus() {
  const { message } = App.useApp()
  const { setTableSelectedKeys } = useTableSelection()

  const { mutate: mark, isPending } = useMutationWithMessage({
    mutationFn: updateSyneyStoreReports,
    invalidateQueries: [['syney-reports']],
    successMessage: (_data, { Nos, Status }) =>
      `已将 ${Nos.length} 条对账单标记为${Status === 'confirmed' ? '已校对' : '未校对'}`,
    errorMessage: error =>
      getUserErrorMessage(error, feedbackText.failed('标记', '对账单')),
    onSuccess: () => {
      // 成功后清空选择
      setTableSelectedKeys([])
    },
  })

  const markStatus = (Nos: string[], Status: ReportStatus) => {
    if (!Nos.length) {
      message.warning(
        feedbackText.selectRequired(
          Status === 'confirmed' ? '标记已校对' : '标记未校对',
        ),
      )
      return
    }
    mark({ Nos, Status })
  }

  return {
    markStatus,
    isPending,
  }
}
