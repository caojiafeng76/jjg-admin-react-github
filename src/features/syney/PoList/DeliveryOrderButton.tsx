import { TruckIcon } from '@heroicons/react/16/solid'
import { Button, Tooltip } from 'antd'

import { usePermission } from '@/hooks/usePermission'
import { SYNEY_DELIVERY_ORDER_PERMISSION } from '@/services/syneyDeliveryOrderContract'
import DeliveryOrderProgressModal from './DeliveryOrderProgressModal'
import { useGenerateDeliveryOrders } from './useGenerateDeliveryOrders'

export default function DeliveryOrderButton() {
  const {
    generateDeliveryOrders,
    open,
    running,
    stopping,
    snapshot,
    hasFile,
    requestStop,
    redownload,
    close,
  } = useGenerateDeliveryOrders()
  const allowed = usePermission(SYNEY_DELIVERY_ORDER_PERMISSION)
  const denied = !allowed

  const btn = (
    <Button
      type="text"
      icon={<TruckIcon className="size-4 text-sky-500/80!" />}
      onClick={generateDeliveryOrders}
      loading={running}
      disabled={denied}
    >
      生成送货单
    </Button>
  )

  return (
    <>
      {denied ? <Tooltip title="无生成送货单权限">{btn}</Tooltip> : btn}
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
