import type { VillaLiftOrder } from '@/services/apiVillaLiftOrders'

import { useCallback, useState } from 'react'

function loadVillaLiftOrdersExcelDocument() {
  return import('./villaLiftOrdersExcelDocument')
}

export function useExportVillaLiftOrdersAsExcel() {
  const [isExporting, setIsExporting] = useState(false)

  const preloadExportAsExcel = useCallback(() => {
    void loadVillaLiftOrdersExcelDocument()
  }, [])

  const exportAsExcel = useCallback(async (orders: VillaLiftOrder[]) => {
    setIsExporting(true)
    try {
      const { exportVillaLiftOrdersAsExcel }
        = await loadVillaLiftOrdersExcelDocument()
      return exportVillaLiftOrdersAsExcel(orders)
    }
    finally {
      setIsExporting(false)
    }
  }, [])

  return { exportAsExcel, isExporting, preloadExportAsExcel }
}
