import { useState, useEffect, useMemo } from 'react'
import { Button, Checkbox, Collapse, Empty, Modal, Skeleton, Tag } from 'antd'
import type { PermissionRow } from '@/services/apiPermissions'

interface Props {
  role: string
  roleLabel: string
  allPermissions: PermissionRow[]
  checkedIds: string[]
  loading: boolean
  saving: boolean
  onSave: (permissionIds: string[]) => void
}

const SCOPE_LABELS: Record<string, string> = {
  nav: '导航',
  page: '页面',
  feature: '功能',
  field: '字段',
}

const SURFACE_COLORS: Record<string, string> = {
  pc: 'blue',
  mobile: 'green',
  both: 'purple',
}

export default function RolePermissionDetail({
  role,
  roleLabel,
  allPermissions,
  checkedIds,
  loading,
  saving,
  onSave,
}: Props) {
  const [localChecked, setLocalChecked] = useState<Set<string>>(
    new Set(checkedIds),
  )

  // 当外部数据变化（换角色等），同步本地状态
  useEffect(() => {
    setLocalChecked(new Set(checkedIds))
  }, [checkedIds, role])

  const isDirty = useMemo(() => {
    if (localChecked.size !== checkedIds.length) return true
    return checkedIds.some((id) => !localChecked.has(id))
  }, [localChecked, checkedIds])

  // 按 module 分组
  const grouped = useMemo(() => {
    const map = new Map<string, PermissionRow[]>()
    for (const perm of allPermissions) {
      const list = map.get(perm.module) ?? []
      list.push(perm)
      map.set(perm.module, list)
    }
    return map
  }, [allPermissions])

  const handleToggle = (permId: string, checked: boolean) => {
    setLocalChecked((prev) => {
      const next = new Set(prev)
      if (checked) next.add(permId)
      else next.delete(permId)
      return next
    })
  }

  const handleModuleToggleAll = (permIds: string[], allChecked: boolean) => {
    setLocalChecked((prev) => {
      const next = new Set(prev)
      permIds.forEach((id) => (allChecked ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const handleSave = () => {
    Modal.confirm({
      title: `保存「${roleLabel}」角色权限`,
      content: '此操作将立即更新该角色的所有权限绑定，确认保存？',
      okText: '确认保存',
      cancelText: '取消',
      onOk: () => onSave(Array.from(localChecked)),
    })
  }

  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />
  }

  if (allPermissions.length === 0) {
    return <Empty description="暂无权限数据" />
  }

  const collapseItems = Array.from(grouped.entries()).map(([module, perms]) => {
    const permIds = perms.map((p) => p.id)
    const checkedCount = permIds.filter((id) => localChecked.has(id)).length
    const allChecked = checkedCount === permIds.length
    const indeterminate = checkedCount > 0 && !allChecked

    return {
      key: module,
      label: (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allChecked}
            indeterminate={indeterminate}
            onChange={() => handleModuleToggleAll(permIds, allChecked)}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="font-medium">{module}</span>
          <span className="text-xs text-gray-400">
            {checkedCount}/{permIds.length}
          </span>
        </div>
      ),
      children: (
        <div className="grid gap-2 pl-6">
          {perms.map((perm) => (
            <div
              key={perm.id}
              className="flex items-center justify-between gap-2"
            >
              <Checkbox
                checked={localChecked.has(perm.id)}
                onChange={(e) => handleToggle(perm.id, e.target.checked)}
              >
                <span className="text-sm">{perm.label}</span>
                <span className="ml-1 text-xs text-gray-400">({perm.key})</span>
              </Checkbox>
              <div className="flex gap-1">
                <Tag className="text-[10px]">
                  {SCOPE_LABELS[perm.scope] ?? perm.scope}
                </Tag>
                <Tag
                  color={SURFACE_COLORS[perm.surface]}
                  className="text-[10px]"
                >
                  {perm.surface}
                </Tag>
              </div>
            </div>
          ))}
        </div>
      ),
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          已选 {localChecked.size} / {allPermissions.length} 项权限
        </span>
        <Button
          type="primary"
          loading={saving}
          disabled={!isDirty}
          onClick={handleSave}
        >
          保存权限
        </Button>
      </div>

      <Collapse
        items={collapseItems}
        defaultActiveKey={Array.from(grouped.keys())}
        size="small"
      />
    </div>
  )
}
