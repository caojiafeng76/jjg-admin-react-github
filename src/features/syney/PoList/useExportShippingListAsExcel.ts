import { message } from 'antd'

import { useSelectedPos } from './useSelectedPos'
import { useAppStore } from '@/store'

const loadShippingListExcelDocument = () =>
  import('./shippingListExcelDocument')

export function useExportShippingListAsExcel() {
  const [messageApi, contextHolder] = message.useMessage()
  const setTableSelectedKeys = useAppStore(
    (state) => state.setTableSelectedKeys,
  )
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
      messageApi.warning('请选择至少一条数据')
      return
    }

    try {
      const { exportShippingListAsExcel: exportShippingList } =
        await loadShippingListExcelDocument()
      const rows = selectedPosList.map(({ poInfo }) => ({
        No: poInfo.No,
        SONo: poInfo.SONo,
        Brand: poInfo.Brand,
        Spec: poInfo.Spec,
        Technique: poInfo.Technique,
        Remark: poInfo.Remark,
      }))
      exportShippingList(rows)
      messageApi.success(`导出成功！共 ${rows.length} 条订单`)
      setTableSelectedKeys([])
    } catch (error) {
      console.error('导出失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      messageApi.error(`导出失败: ${errorMessage}`)
    }
  }

  return { exportShippingListAsExcel, preloadExcel, contextHolder }
}
