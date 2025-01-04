import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { Button, message } from 'antd'
import { usePrintDecomposition } from './usePrintDecomposition'
import { useAppStore } from '@/store'

export default function PrintDecompositionButton() {
  const { printDecomposition } = usePrintDecomposition()
  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()

  function onClick() {
    if (tableSelectedKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    if (tableSelectedKeys.length > 4) {
      message.warning('最多选择四条数据')
      return
    }
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
