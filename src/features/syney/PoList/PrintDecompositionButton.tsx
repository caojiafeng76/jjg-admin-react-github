import { DocumentArrowDownIcon } from '@heroicons/react/16/solid'
import { Button, message } from 'antd'
import { usePrintDecomposition } from './usePrintDecomposition'
import { useAppStore } from '@/store'

export default function PrintDecompositionButton() {
  const { printDecomposition, contextHolder } = usePrintDecomposition()
  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()
  const [messageApi, contextHolder2] = message.useMessage()

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
      {contextHolder2}
      <Button
        type="text"
        icon={<DocumentArrowDownIcon className="size-4 !text-red-500/80" />}
        onClick={onClick}
      >
        打印分解单
      </Button>
    </>
  )
}
