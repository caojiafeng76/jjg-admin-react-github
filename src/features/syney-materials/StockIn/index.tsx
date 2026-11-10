import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import SyneyMaterialsMobileStockPage from '../Mobile/SyneyMaterialsMobileStockPage'
import SyneyMaterialsStockPage from '../Stock/SyneyMaterialsStockPage'

export default function SyneyMaterialsStockInPage() {
  const { role } = useAuth()
  return isEmployeeSideRole(role)
    ? <SyneyMaterialsMobileStockPage direction="in" />
    : <SyneyMaterialsStockPage direction="in" />
}
