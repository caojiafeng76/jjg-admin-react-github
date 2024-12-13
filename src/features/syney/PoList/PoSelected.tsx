import { Select } from 'antd'
import { useUpdatePos } from './useUpdatePos'
import { useStore } from '@/store'

export default function PoSelected() {
  const { updatePos, isUpdating: isPoUpdating } = useUpdatePos()
  const { tableSelectedKeys, setTableSelectedKeys } = useStore()

  const changeStatus = (value: string) => {
    updatePos({
      ids: tableSelectedKeys.map(String),
      data: { Status: value },
    })
    setTableSelectedKeys([])
  }

  return (
    <Select
      className="w-32"
      disabled={isPoUpdating}
      onChange={changeStatus}
      options={[
        { value: '已创建', label: <span>已创建</span> },
        { value: '已入库', label: <span>已入库</span> },
        { value: '部分送货', label: <span>部分送货</span> },
        { value: '暂停', label: <span>暂停</span> },
        { value: '作废', label: <span>作废</span> },
      ]}
    />
  )
}
