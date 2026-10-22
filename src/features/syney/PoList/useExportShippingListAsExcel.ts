import { App } from 'antd'

import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useTableSelection } from '../useTableSelection'
import { useSelectedPos } from './useSelectedPos'

function loadShippingListExcelDocument() {
  return import('./shippingListExcelDocument')
}

export function useExportShippingListAsExcel() {
  const { message: messageApi } = App.useApp()
  const { setTableSelectedKeys } = useTableSelection()
  const { isLoading, selectedPosList } = useSelectedPos()

  function preloadExcel() {
    void loadShippingListExcelDocument()
  }

  async function exportShippingListAsExcel() {
    if (isLoading) {
      messageApi.warning('数据加载中，请稍后再试')
      return
    }

    if (!selectedPosList || selectedPosList.length === 0) {
      messageApi.warning(feedbackText.selectRequired('导出'))
      return
    }

    try {
      const { exportShippingListAsExcel: exportShippingList }
        = await loadShippingListExcelDocument()
      const rows = selectedPosList.map(({ poInfo }) => ({
        No: poInfo.No,
        SONo: poInfo.SONo,
        Brand: poInfo.Brand,
        Spec: poInfo.Spec,
        Technique: poInfo.Technique,
        Remark: poInfo.Remark,
      }))
      exportShippingList(rows)
      messageApi.success(feedbackText.exported('订单发货清单', rows.length))
      setTableSelectedKeys([])
    }
    catch (error) {
      console.error('导出失败:', error)
      messageApi.error(
        getUserErrorMessage(error, feedbackText.failed('导出', '发货清单')),
      )
    }
  }

  return { exportShippingListAsExcel, preloadExcel }
}
