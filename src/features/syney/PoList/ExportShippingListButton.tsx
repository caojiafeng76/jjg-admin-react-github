import { TruckIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'
import { usePermission } from '@/hooks/usePermission'
import { useExportShippingListAsExcel } from './useExportShippingListAsExcel'

export default function ExportShippingListButton() {
  const { exportShippingListAsExcel, preloadExcel }
    = useExportShippingListAsExcel()
  const allowed = usePermission('feature:syney-po-list.export')
  const denied = !allowed
  const btn = (
    <Button
      type="text"
      icon={<TruckIcon className="size-4 text-emerald-500/80!" />}
      onClick={exportShippingListAsExcel}
      onMouseEnter={preloadExcel}
      onFocus={preloadExcel}
      disabled={denied}
    >
      导出发货清单
    </Button>
  )
  return (
    <>
      {denied ? <Tooltip title="无导出权限">{btn}</Tooltip> : btn}
    </>
  )
}
