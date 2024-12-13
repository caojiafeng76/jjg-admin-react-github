import { DocumentIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { useGenerateSummaryPDF } from './useGenerateSummaryPDF'

export default function ExportPDFButton() {
  const { generateSummaryPDF } = useGenerateSummaryPDF()

  return (
    <Button
      type="text"
      icon={<DocumentIcon className="size-4 !text-red-500/80" />}
      onClick={generateSummaryPDF}
    >
      打印汇总单
    </Button>
  )
}
