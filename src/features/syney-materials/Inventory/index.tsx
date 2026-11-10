import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import SyneyMaterialsMobileInventoryPage from '../Mobile/SyneyMaterialsMobileInventoryPage'
import SyneyMaterialsInventoryPcPage from './SyneyMaterialsInventoryPcPage'

/** 员工端（手机布局）显示只读的查库存页，其他角色显示 PC 库存管理页 */
export default function SyneyMaterialsInventoryPage() {
  const { role } = useAuth()
  return isEmployeeSideRole(role)
    ? <SyneyMaterialsMobileInventoryPage />
    : <SyneyMaterialsInventoryPcPage />
}
