import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { usePrintDecomposition } from './usePrintDecomposition'
import { useStore } from '@/store'

export default function PrintDecompositionButton() {
  const { printDecomposition } = usePrintDecomposition()
  const { setTableSelectedKeys } = useStore()

  function onClick() {
    printDecomposition()
    setTableSelectedKeys([])
  }

  return (
    <Button
      type="text"
      icon={<DocumentArrowDownIcon className="size-4 !text-red-500/80" />}
      onClick={onClick}
    >
      打印分解单
    </Button>
  )
}
