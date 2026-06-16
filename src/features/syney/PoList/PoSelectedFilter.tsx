import { Select } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { CheckCircleIcon, ArrowPathIcon, PauseCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/16/solid'

const STATUS_OPTIONS: Array<{
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = [
  { value: '全部', label: '全部', icon: CheckCircleIcon, color: 'text-slate-400' },
  { value: '已创建', label: '已创建', icon: XCircleIcon, color: 'text-rose-500' },
  { value: '已入库', label: '已入库', icon: CheckCircleIcon, color: 'text-emerald-500' },
  { value: '部分送货', label: '部分送货', icon: ArrowPathIcon, color: 'text-amber-500' },
  { value: '暂停', label: '暂停', icon: PauseCircleIcon, color: 'text-pink-500' },
  { value: '作废', label: '作废', icon: ExclamationTriangleIcon, color: 'text-slate-500' },
]

export default function PoSelectedFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [value, setValue] = useState<string>(
    searchParams.get('Status') || '全部',
  )

  useEffect(() => {
    setValue(searchParams.get('Status') || '全部')
  }, [searchParams])

  function filterStatus(newValue: string) {
    setValue(newValue)
    if (newValue === '全部') {
      searchParams.delete('Status')
    } else {
      searchParams.set('Status', newValue)
    }
    searchParams.set('page', '1')
    searchParams.set('pageSize', '10')
    setSearchParams(searchParams)
  }

  return (
    <Select
      className="w-32 rounded-lg"
      onChange={filterStatus}
      value={value}
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
