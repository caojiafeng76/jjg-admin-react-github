import { TruckIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'
import { useExportShippingListAsExcel } from './useExportShippingListAsExcel'
import { usePermission } from '@/hooks/usePermission'

export default function ExportShippingListButton() {
  const { exportShippingListAsExcel, preloadExcel, contextHolder } =
    useExportShippingListAsExcel()
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
      {contextHolder}
      {denied ? <Tooltip title="无导出权限">{btn}</Tooltip> : btn}
    </>
  )
}
