import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import SyneyMaterialsMobileStockPage from '../Mobile/SyneyMaterialsMobileStockPage'
import SyneyMaterialsStockPage from '../Stock/SyneyMaterialsStockPage'

export default function SyneyMaterialsStockOutPage() {
  const { role } = useAuth()
  return isEmployeeSideRole(role)
    ? <SyneyMaterialsMobileStockPage direction="out" />
    : <SyneyMaterialsStockPage direction="out" />
}
