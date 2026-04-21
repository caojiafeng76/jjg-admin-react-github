import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'
import { useExportSafePartInfoAsExcel } from './useExportSafePartInfoAsExcel'
import { usePermission } from '@/hooks/usePermission'

export default function ExportInfoButton() {
  const { exportSafePartInfoAsExcel, contextHolder } =
    useExportSafePartInfoAsExcel()
  const allowed = usePermission('feature:syney-po-list.export')
  const denied = !allowed
  const btn = (
    <Button
      type="text"
      icon={<DocumentArrowDownIcon className="size-4 text-green-500/80!" />}
      onClick={exportSafePartInfoAsExcel}
      disabled={denied}
    >
      导出安全部件信息
    </Button>
  )
  return (
    <>
      {contextHolder}
      {denied ? <Tooltip title="无导出权限">{btn}</Tooltip> : btn}
    </>
  )
}
