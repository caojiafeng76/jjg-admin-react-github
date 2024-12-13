import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { usePrintDecomposition } from './usePrintDecomposition'

export default function PrintDecompositionButton() {
  const { printDecomposition } = usePrintDecomposition()

  return (
    <Button
      type="text"
      icon={<DocumentArrowDownIcon className="size-4 !text-red-500/80" />}
      onClick={printDecomposition}
    >
      打印分解单
    </Button>
  )
}
