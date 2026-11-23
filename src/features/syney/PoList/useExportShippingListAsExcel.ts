import { App } from 'antd'
import { useState } from 'react'

import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useTableSelection } from '../useTableSelection'
import { useFetchSelectedPos } from './useFetchSelectedPos'

function loadShippingListExcelDocument() {
  return import('./shippingListExcelDocument')
}

export function useExportShippingListAsExcel() {
  const { message: messageApi } = App.useApp()
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()
  const { fetchSelectedPos } = useFetchSelectedPos()
  const [exporting, setExporting] = useState(false)

  function preloadExcel() {
    void loadShippingListExcelDocument()
  }

  async function exportShippingListAsExcel() {
    if (exporting) {
      return
    }

    if (tableSelectedKeys.length === 0) {
      messageApi.warning(feedbackText.selectRequired('导出'))
      return
    }

    setExporting(true)
    try {
      const selectedPosList = await fetchSelectedPos()

      if (selectedPosList.length === 0) {
        messageApi.warning(feedbackText.selectRequired('导出'))
        return
      }

      const { exportShippingListAsExcel: exportShippingList }
        = await loadShippingListExcelDocument()
      const rows = selectedPosList.map(({ po }) => ({
        No: po.No,
        SONo: po.SONo,
        Brand: po.Brand,
        Spec: po.Spec,
        Technique: po.Technique,
        Remark: po.Remark,
        DeliveryNo: po.DeliveryNo,
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
    finally {
      setExporting(false)
    }
  }

  return { exportShippingListAsExcel, preloadExcel, exporting }
}
