import { TruckIcon } from '@heroicons/react/16/solid'

import { SYNEY_DELIVERY_ORDER_PERMISSION } from '@/services/syneyDeliveryOrderContract'
import PermissionButton from '@/ui/PermissionButton'
import DeliveryOrderProgressModal from './DeliveryOrderProgressModal'
import { useGenerateDeliveryOrders } from './useGenerateDeliveryOrders'

export default function DeliveryOrderButton() {
  const {
    generateDeliveryOrders,
    open,
    preparing,
    running,
    stopping,
    snapshot,
    hasFile,
    requestStop,
    redownload,
    close,
  } = useGenerateDeliveryOrders()

  return (
    <>
      <PermissionButton
        type="text"
        permissionKey={SYNEY_DELIVERY_ORDER_PERMISSION}
        noPermissionTip="无生成送货单权限"
        icon={<TruckIcon className="size-4" />}
        onClick={() => void generateDeliveryOrders()}
        loading={running || preparing}
      >
        生成送货单
      </PermissionButton>
      <DeliveryOrderProgressModal
        open={open}
        running={running}
        stopping={stopping}
        snapshot={snapshot}
        hasFile={hasFile}
        onStop={requestStop}
        onRedownload={redownload}
        onClose={close}
      />
    </>
  )
}
