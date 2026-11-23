import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  TruckIcon,
  XCircleIcon,
} from '@heroicons/react/16/solid'
import { App, Select, Tooltip } from 'antd'
import { useState } from 'react'

import { usePermission } from '@/hooks/usePermission'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { feedbackText } from '@/utils/feedbackText'
import { useTableSelection } from '../useTableSelection'
import { useUpdatePos } from './useUpdatePos'

const STATUS_OPTIONS: Array<{
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = [
  { value: '已创建', label: '已创建', icon: XCircleIcon, color: 'text-rose-500' },
  { value: '已入库', label: '已入库', icon: CheckCircleIcon, color: 'text-emerald-500' },
  { value: '部分送货', label: '部分送货', icon: ArrowPathIcon, color: 'text-amber-500' },
  { value: '已送货', label: '已送货', icon: TruckIcon, color: 'text-sky-500' },
  { value: '暂停', label: '暂停', icon: PauseCircleIcon, color: 'text-pink-500' },
  { value: '作废', label: '作废', icon: ExclamationTriangleIcon, color: 'text-slate-500 dark:text-slate-400' },
]

export default function PoSelected() {
  const { message } = App.useApp()
  const { updatePos, isUpdating: isPoUpdating } = useUpdatePos()
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()
  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    undefined,
  )
  const allowed = usePermission('feature:syney-po-list.edit')
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard({
    bypassPermissionKey: 'feature:syney-po-list.edit',
  })
  const denied = viewerDenied || !allowed

  const changeStatus = (value: string) => {
    if (denied) {
      return
    }

    if (tableSelectedKeys.length === 0) {
      message.warning(feedbackText.selectRequired('修改状态'))
      setSelectedValue(undefined)
      return
    }

    setSelectedValue(value)
    updatePos(
      {
        ids: tableSelectedKeys.map(String),
        data: { Status: value },
      },
      {
        onSuccess: () => {
          setTableSelectedKeys([])
        },
        onSettled: () => {
          setSelectedValue(undefined)
        },
      },
    )
  }

  const select = (
    <Select
      className="w-32 rounded-lg"
      disabled={denied || isPoUpdating}
      value={selectedValue}
      onChange={changeStatus}
      placeholder="选择操作"
      getPopupContainer={() => document.body}
      suffixIcon={null}
      options={STATUS_OPTIONS.map(option => ({
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

  return denied
    ? <Tooltip title={viewerDenied ? viewerOperationTip : '无编辑权限'}>{select}</Tooltip>
    : select
}
