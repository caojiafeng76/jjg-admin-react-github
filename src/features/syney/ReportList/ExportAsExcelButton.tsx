import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { useExportReportsAsExcel } from './useExportReportsAsExcel'

export default function ExportAsExcelButton() {
  const { saveReportsAsExcel } = useExportReportsAsExcel()

  return (
    <Button
      type="text"
      icon={<DocumentArrowDownIcon className="size-4 !text-green-500/80" />}
      onClick={saveReportsAsExcel}
    >
      导出为Excel
    </Button>
  )
}
