import { DocumentIcon } from '@heroicons/react/16/solid'
import { Button, App } from 'antd'
import { useGenerateSummaryPDF } from './useGenerateSummaryPDF'
import { useAppStore } from '@/store'

export default function ExportPDFButton() {
  const { message } = App.useApp()
  const { setTableSelectedKeys } = useAppStore()
  const { generateSummaryPDF, isLoading } = useGenerateSummaryPDF()

  const handleExport = async () => {
    // 如果正在加载，提示用户
    if (isLoading) {
      message.loading('数据加载中，请稍候...', 1)
      return
    }

    // 调用生成函数，根据返回值显示消息
    const success = await generateSummaryPDF()
    if (success) {
      message.success('PDF 文件生成成功')
      setTableSelectedKeys([])
    } else {
      message.warning('没有可导出的数据')
    }
  }

  return (
    <Button
      type="text"
      icon={<DocumentIcon className="size-4 text-red-500/80!" />}
      onClick={handleExport}
      loading={isLoading}
      disabled={isLoading}
    >
      打印汇总单
    </Button>
  )
}
