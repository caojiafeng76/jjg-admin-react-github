import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { usePrintDecomposition } from './usePrintDecomposition'
import { useAppStore } from '@/store'

export default function PrintDecompositionButton() {
  const { printDecomposition, contextHolder, messageApi } = usePrintDecomposition()
  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()

  function onClick() {
    if (tableSelectedKeys.length === 0) {
      messageApi.warning('请选择至少一条数据')
      return
    }
    if (tableSelectedKeys.length > 4) {
      messageApi.warning('最多选择四条数据')
      return
    }
    printDecomposition()
    setTableSelectedKeys([])
  }

  return (
    <>
      {contextHolder}
      <Button
        type="text"
        icon={<DocumentArrowDownIcon className="size-4 text-red-500/80!" />}
        onClick={onClick}
      >
        打印分解单
      </Button>
    </>
  )
}
