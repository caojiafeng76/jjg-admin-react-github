import type { SyneySafePartSetting } from '@services/apiSyneySafePartSettings'

import { usePoLabelPrint } from './usePrint'

export function usePrintEnglish(
  safePartSettings: SyneySafePartSetting[] | undefined,
  isSafePartSettingsLoading: boolean,
) {
  const { printLabels, preloadPDF, isPrinting } = usePoLabelPrint(
    'en',
    safePartSettings,
    isSafePartSettingsLoading,
  )

  return {
    generateEnglishLabel: printLabels,
    preloadPDF,
    isPrinting,
  }
}
