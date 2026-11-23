import { TruckIcon } from '@heroicons/react/16/solid'
import PermissionButton from '@/ui/PermissionButton'
import { useExportShippingListAsExcel } from './useExportShippingListAsExcel'

export default function ExportShippingListButton() {
  const { exportShippingListAsExcel, preloadExcel, exporting }
    = useExportShippingListAsExcel()

  return (
    <PermissionButton
      type="text"
      permissionKey="feature:syney-po-list.export"
      noPermissionTip="无导出权限"
      icon={<TruckIcon className="size-4" />}
      onClick={exportShippingListAsExcel}
      onMouseEnter={preloadExcel}
      onFocus={preloadExcel}
      loading={exporting}
    >
      导出发货清单
    </PermissionButton>
  )
}
