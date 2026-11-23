import { App } from 'antd'

import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
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

  const { mutateAsync: mark, isPending } = useMutationWithInvalidation({
    mutationFn: updateSyneyStoreReports,
    invalidateQueries: [['syney-reports']],
  })

  async function markStatus(Nos: string[], Status: ReportStatus) {
    if (!Nos.length) {
      message.warning(
        feedbackText.selectRequired(
          Status === 'confirmed' ? '标记已校对' : '标记未校对',
        ),
      )
      return
    }

    try {
      await mark({ Nos, Status })
      message.success(
        `已将 ${Nos.length} 条对账单标记为${Status === 'confirmed' ? '已校对' : '未校对'}`,
      )
      setTableSelectedKeys([])
    }
    catch (error) {
      message.error(getUserErrorMessage(error, feedbackText.failed('标记', '对账单')))
    }
  }

  return {
    markStatus,
    isPending,
  }
}
