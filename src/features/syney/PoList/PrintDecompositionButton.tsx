import type { SyneySafePartSetting } from '@/services/apiSyneySafePartSettings'
import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { App, Button } from 'antd'
import { feedbackText } from '@/utils/feedbackText'
import { useTableSelection } from '../useTableSelection'
import { usePrintDecomposition } from './usePrintDecomposition'

interface PrintDecompositionButtonProps {
  safePartSettings?: SyneySafePartSetting[]
  isSafePartSettingsLoading: boolean
}

export default function PrintDecompositionButton({
  safePartSettings,
  isSafePartSettingsLoading,
}: PrintDecompositionButtonProps) {
  const { message } = App.useApp()
  const { printDecomposition, preloadPDF }
    = usePrintDecomposition(safePartSettings, isSafePartSettingsLoading)
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()

  function onClick() {
    if (tableSelectedKeys.length === 0) {
      message.warning(feedbackText.selectRequired('打印'))
      return
    }
    if (tableSelectedKeys.length > 4) {
      message.warning('分解单一次最多打印 4 条订单')
      return
    }
    printDecomposition()
    setTableSelectedKeys([])
  }

  return (
    <>
      <Button
        type="text"
        icon={<DocumentArrowDownIcon className="size-4 text-rose-500/80!" />}
        onClick={onClick}
        onMouseEnter={preloadPDF}
        onFocus={preloadPDF}
      >
        打印分解单
      </Button>
    </>
  )
}
