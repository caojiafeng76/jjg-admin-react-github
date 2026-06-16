import { Select } from 'antd'
import { useState } from 'react'
import {
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  XCircleIcon,
} from '@heroicons/react/16/solid'
import { useUpdatePos } from './useUpdatePos'
import { useAppStore } from '@/store'

const STATUS_OPTIONS: Array<{
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = [
  { value: '已创建', label: '已创建', icon: XCircleIcon, color: 'text-rose-500' },
  { value: '已入库', label: '已入库', icon: CheckCircleIcon, color: 'text-emerald-500' },
  { value: '部分送货', label: '部分送货', icon: ArrowPathIcon, color: 'text-amber-500' },
  { value: '暂停', label: '暂停', icon: PauseCircleIcon, color: 'text-pink-500' },
  { value: '作废', label: '作废', icon: ExclamationTriangleIcon, color: 'text-slate-500' },
]

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
          setSelectedValue(undefined)
          setTableSelectedKeys([])
        },
      },
    )
  }

  return (
    <Select
      className="w-32 rounded-lg"
      disabled={isPoUpdating}
      value={selectedValue}
      onChange={changeStatus}
      placeholder="选择操作"
      getPopupContainer={() => document.body}
      suffixIcon={null}
      options={STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: (
          <span className="inline-flex items-center gap-1.5">
            <option.icon className={`h-3.5 w-3.5 ${option.color}`} />
            <span>{option.label}</span>
          </span>
        ),
      }))}
    />
  )
}
