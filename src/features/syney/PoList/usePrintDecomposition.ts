import type { SyneySafePartSetting } from '@/services/apiSyneySafePartSettings'
import { App } from 'antd'
import { useState } from 'react'

import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useTableSelection } from '../useTableSelection'
import { useFetchSelectedPos } from './useFetchSelectedPos'

function loadDecompositionPdfDocument() {
  return import('./decompositionPdfDocument')
}

export function usePrintDecomposition(
  safePartSettings?: SyneySafePartSetting[],
  isSafePartSettingsLoading = false,
) {
  const { tableSelectedKeys } = useTableSelection()
  const { fetchSelectedPos } = useFetchSelectedPos()
  const { message: messageApi } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  function preloadPDF() {
    void loadDecompositionPdfDocument()
  }

  async function printDecomposition(): Promise<boolean> {
    if (isPrinting) {
      return false
    }

    if (tableSelectedKeys.length === 0) {
      messageApi.warning(feedbackText.selectRequired('打印'))
      return false
    }

    if (tableSelectedKeys.length > 4) {
      messageApi.warning('分解单一次最多打印 4 条订单')
      return false
    }

    if (isSafePartSettingsLoading || !safePartSettings) {
      messageApi.warning('件号配置加载中，请稍后再试')
      return false
    }

    try {
      setIsPrinting(true)
      const selectedPosList = await fetchSelectedPos()

      if (selectedPosList.length === 0) {
        messageApi.warning('没有数据可供打印')
        return false
      }

      const { generateDecompositionPDF } = await loadDecompositionPdfDocument()
      await generateDecompositionPDF(selectedPosList, safePartSettings)
      messageApi.success('分解单已生成')
      return true
    }
    catch (error) {
      console.error('打印分解单失败:', error)
      messageApi.error(
        getUserErrorMessage(error, feedbackText.failed('打印', '分解单')),
      )
      return false
    }
    finally {
      setIsPrinting(false)
    }
  }

  return {
    printDecomposition,
    preloadPDF,
    isPrinting,
  }
}
