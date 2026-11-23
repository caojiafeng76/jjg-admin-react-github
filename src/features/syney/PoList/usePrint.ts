import type { SyneySafePartSetting } from '@services/apiSyneySafePartSettings'
import { App } from 'antd'
import { useState } from 'react'

import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useTableSelection } from '../useTableSelection'
import { useFetchSelectedPos } from './useFetchSelectedPos'

export type SyneyLabelLocale = 'zh' | 'en'

function loadPoLabelPdfDocument() {
  return import('./poLabelPdfDocument')
}

export function usePoLabelPrint(
  locale: SyneyLabelLocale,
  safePartSettings: SyneySafePartSetting[] | undefined,
  isSafePartSettingsLoading: boolean,
) {
  const { tableSelectedKeys } = useTableSelection()
  const { fetchSelectedPos } = useFetchSelectedPos()
  const { message: api } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  function preloadPDF() {
    void loadPoLabelPdfDocument()
  }

  async function printLabels(): Promise<boolean> {
    if (isPrinting) {
      return false
    }

    if (tableSelectedKeys.length === 0) {
      api.warning(feedbackText.selectRequired('打印'))
      return false
    }

    if (isSafePartSettingsLoading || !safePartSettings) {
      api.warning('件号配置加载中，请稍后再试')
      return false
    }

    try {
      setIsPrinting(true)
      const selectedPosList = await fetchSelectedPos()

      if (selectedPosList.length === 0) {
        api.warning('没有数据可供打印')
        return false
      }

      const { generatePoLabelsPDF } = await loadPoLabelPdfDocument()
      await generatePoLabelsPDF(selectedPosList, safePartSettings, locale)
      return true
    }
    catch (error) {
      const entity = locale === 'zh' ? '中文标签' : '英文标签'
      console.error(`打印${entity}失败:`, error)
      api.error(getUserErrorMessage(error, feedbackText.failed('打印', entity)))
      return false
    }
    finally {
      setIsPrinting(false)
    }
  }

  return {
    printLabels,
    preloadPDF,
    isPrinting,
  }
}

export function usePrint(
  safePartSettings: SyneySafePartSetting[] | undefined,
  isSafePartSettingsLoading: boolean,
) {
  const { printLabels, preloadPDF, isPrinting } = usePoLabelPrint(
    'zh',
    safePartSettings,
    isSafePartSettingsLoading,
  )

  return {
    generateLabel: printLabels,
    preloadPDF,
    isPrinting,
  }
}
