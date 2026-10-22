import { DocumentIcon } from '@heroicons/react/16/solid'
import { App, Button } from 'antd'
import { useTableSelection } from '../useTableSelection'
import { useGenerateSummaryPDF } from './useGenerateSummaryPDF'

export default function ExportPDFButton() {
  const { message } = App.useApp()
  const { setTableSelectedKeys } = useTableSelection()
  const { generateSummaryPDF, preloadPDF, isLoading } = useGenerateSummaryPDF()

  const handleExport = async () => {
    if (isLoading) {
      message.warning('对账单数据加载中，请稍后再试')
      return
    }

    // 成功 / 失败提示由 useGenerateSummaryPDF 统一弹出
    const success = await generateSummaryPDF()
    if (success) {
      setTableSelectedKeys([])
    }
  }

  return (
    <Button
      type="text"
      icon={<DocumentIcon className="size-4 text-red-500/80!" />}
      onClick={handleExport}
      onMouseEnter={preloadPDF}
      onFocus={preloadPDF}
      loading={isLoading}
      disabled={isLoading}
    >
      打印汇总单
    </Button>
  )
}
