import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { useExportSafePartInfoAsExcel } from './useExportSafePartInfoAsExcel'

export default function ExportInfoButton() {
  const { exportSafePartInfoAsExcel, contextHolder } =
    useExportSafePartInfoAsExcel()
  return (
    <>
      {contextHolder}
      <Button
        type="text"
        icon={<DocumentArrowDownIcon className="size-4 text-green-500/80!" />}
        onClick={exportSafePartInfoAsExcel}
      >
        导出安全部件信息
      </Button>
    </>
  )
}
