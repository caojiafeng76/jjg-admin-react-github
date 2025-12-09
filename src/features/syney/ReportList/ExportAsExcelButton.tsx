import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { Button, App } from 'antd'
import { useExportReportsAsExcel } from './useExportReportsAsExcel'

export default function ExportAsExcelButton() {
  const { message } = App.useApp()
  const { saveReportsAsExcel, isLoading } = useExportReportsAsExcel()

  const handleExport = () => {
    // 如果正在加载，提示用户
    if (isLoading) {
      message.loading('数据加载中，请稍候...', 1)
      return
    }

    // 调用导出函数，根据返回值显示消息
    const success = saveReportsAsExcel()
    if (success) {
      message.success('Excel 文件导出成功')
    } else {
      message.warning('没有可导出的数据')
    }
  }

  return (
    <Button
      type="text"
      icon={<DocumentArrowDownIcon className="size-4 text-green-500/80!" />}
      onClick={handleExport}
      loading={isLoading}
      disabled={isLoading}
    >
      导出为Excel
    </Button>
  )
}
