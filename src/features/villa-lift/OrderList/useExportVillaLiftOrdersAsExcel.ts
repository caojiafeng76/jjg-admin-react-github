import { useCallback, useState } from 'react'

import type { VillaLiftOrder } from '@/services/apiVillaLiftOrders'

const loadVillaLiftOrdersExcelDocument = () =>
  import('./villaLiftOrdersExcelDocument')

export function useExportVillaLiftOrdersAsExcel() {
  const [isExporting, setIsExporting] = useState(false)

  const preloadExportAsExcel = useCallback(() => {
    void loadVillaLiftOrdersExcelDocument()
  }, [])

  const exportAsExcel = useCallback(async (orders: VillaLiftOrder[]) => {
    setIsExporting(true)
    try {
      const { exportVillaLiftOrdersAsExcel } =
        await loadVillaLiftOrdersExcelDocument()
      return exportVillaLiftOrdersAsExcel(orders)
    } finally {
      setIsExporting(false)
    }
  }, [])

  return { exportAsExcel, isExporting, preloadExportAsExcel }
}
