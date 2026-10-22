import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { App, Button } from 'antd'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useTableSelection } from '../useTableSelection'
import { useExportReportsAsExcel } from './useExportReportsAsExcel'

export default function ExportAsExcelButton() {
  const { message } = App.useApp()
  const { setTableSelectedKeys } = useTableSelection()
  const { saveReportsAsExcel, preloadExcel, isLoading }
    = useExportReportsAsExcel()

  const handleExport = async () => {
    if (isLoading) {
      message.warning('对账单数据加载中，请稍后再试')
      return
    }

    try {
      const success = await saveReportsAsExcel()
      if (success) {
        message.success('对账单 Excel 已导出')
        setTableSelectedKeys([])
      }
      else {
        message.warning(feedbackText.selectRequired('导出'))
      }
    }
    catch (error) {
      message.error(
        getUserErrorMessage(error, feedbackText.failed('导出', '对账单')),
      )
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
