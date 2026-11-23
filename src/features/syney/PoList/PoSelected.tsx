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
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { useTableSelection } from '../useTableSelection'
import { useUpdatePos } from './useUpdatePos'

const STATUS_OPTIONS: Array<{
  value: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  colorClassName: string
}> = [
  { value: '已创建', label: '已创建', icon: XCircleIcon, colorClassName: 'text-error' },
  { value: '已入库', label: '已入库', icon: CheckCircleIcon, colorClassName: 'text-success' },
  { value: '部分送货', label: '部分送货', icon: ArrowPathIcon, colorClassName: 'text-primary' },
  { value: '已送货', label: '已送货', icon: TruckIcon, colorClassName: 'text-primary' },
  { value: '暂停', label: '暂停', icon: PauseCircleIcon, colorClassName: 'text-warning' },
  { value: '作废', label: '作废', icon: ExclamationTriangleIcon, colorClassName: 'text-slate-500 dark:text-slate-400' },
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

  async function changeStatus(value: string) {
    if (denied) {
      return
    }

    if (tableSelectedKeys.length === 0) {
      message.warning(feedbackText.selectRequired('修改状态'))
      setSelectedValue(undefined)
      return
    }

    const ids = tableSelectedKeys.map(String)
    setSelectedValue(value)
    try {
      await updatePos({
        ids,
        data: { Status: value },
      })
      message.success(
        ids.length > 1
          ? feedbackText.batch('更新状态', '订单', ids.length)
          : feedbackText.updated('订单状态'),
      )
      setTableSelectedKeys([])
    }
    catch (error) {
      message.error(getUserErrorMessage(error, feedbackText.failed('更新状态', '订单')))
    }
    finally {
      setSelectedValue(undefined)
    }
  }

  const select = (
    <Select
      className="w-32 rounded-lg"
      disabled={denied || isPoUpdating}
      value={selectedValue}
      onChange={value => void changeStatus(value)}
      placeholder="批量改状态"
      getPopupContainer={() => document.body}
      suffixIcon={null}
      options={STATUS_OPTIONS.map(option => ({
        value: option.value,
        label: (
          <span className="inline-flex items-center gap-1.5">
            <option.icon className={`size-4 ${option.colorClassName}`} />
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
