import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { App, Button } from 'antd'
import { useAppStore } from '@/store'
import { useExportReportsAsExcel } from './useExportReportsAsExcel'

export default function ExportAsExcelButton() {
  const { message } = App.useApp()
  const setTableSelectedKeys = useAppStore(
    state => state.setTableSelectedKeys,
  )
  const { saveReportsAsExcel, preloadExcel, isLoading }
    = useExportReportsAsExcel()

  const handleExport = async () => {
    // 如果正在加载，提示用户
    if (isLoading) {
      message.loading('数据加载中，请稍候...', 1)
      return
    }

    // 调用导出函数，根据返回值显示消息
    const success = await saveReportsAsExcel()
    if (success) {
      message.success('Excel 文件导出成功')
      setTableSelectedKeys([])
    }
    else {
      message.warning('没有可导出的数据')
    }
  }

  return (
    <Button
      type="text"
      icon={<DocumentArrowDownIcon className="size-4 text-green-500/80!" />}
      onClick={handleExport}
      onMouseEnter={preloadExcel}
      onFocus={preloadExcel}
      loading={isLoading}
      disabled={isLoading}
    >
      导出为Excel
    </Button>
  )
}
