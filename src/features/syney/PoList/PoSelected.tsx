import { Select } from 'antd'
import { useState } from 'react'
import { useUpdatePos } from './useUpdatePos'
import { useAppStore } from '@/store'

export default function PoSelected() {
  const { updatePos, isUpdating: isPoUpdating } = useUpdatePos()
  const { tableSelectedKeys, setTableSelectedKeys } = useAppStore()
  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    undefined,
  )

  const changeStatus = (value: string) => {
    setSelectedValue(value)
    updatePos(
      {
        ids: tableSelectedKeys.map(String),
        data: { Status: value },
      },
      {
        onSuccess: () => {
          setSelectedValue(undefined) // 成功后置空
          setTableSelectedKeys([])
        },
      },
    )
  }

  return (
    <Select
      className="w-32"
      disabled={isPoUpdating}
      value={selectedValue}
      onChange={changeStatus}
      placeholder="选择操作"
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
