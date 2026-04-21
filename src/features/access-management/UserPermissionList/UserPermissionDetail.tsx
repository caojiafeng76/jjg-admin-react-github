import { useMemo, useState, useEffect } from 'react'
import { Button, Modal, Select, Skeleton, Table, Tag } from 'antd'
import type { PermissionRow } from '@/services/apiPermissions'
import type { UserOverrideRow } from '@/services/apiPermissions'

type OverrideValue = 'default' | 'allow' | 'deny'

interface Props {
  employee: { id: string; name: string; role: string | null }
  allPermissions: PermissionRow[]
  rolePermissionIds: string[]
  userOverrides: UserOverrideRow[]
  loadingPerms: boolean
  saving: boolean
  onSave: (overrides: Array<{ permissionId: string; enabled: boolean }>) => void
  onBack: () => void
}

const OVERRIDE_OPTIONS = [
  { label: '跟随角色', value: 'default' },
  { label: '额外授权', value: 'allow' },
  { label: '强制拒绝', value: 'deny' },
]

export default function UserPermissionDetail({
  employee,
  allPermissions,
  rolePermissionIds,
  userOverrides,
  loadingPerms,
  saving,
  onSave,
  onBack,
}: Props) {
  // 初始化：从 userOverrides 还原 map
  const buildInitialMap = () => {
    const map = new Map<string, OverrideValue>()
    for (const ov of userOverrides) {
      map.set(ov.permission_id, ov.enabled ? 'allow' : 'deny')
    }
    return map
  }

  const [overrideMap, setOverrideMap] =
    useState<Map<string, OverrideValue>>(buildInitialMap)

  useEffect(() => {
    setOverrideMap(buildInitialMap())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userOverrides, employee.id])

  const isDirty = useMemo(() => {
    // 比较 overrideMap 与原始 userOverrides
    const originalMap = new Map(
      userOverrides.map((ov) => [
        ov.permission_id,
        ov.enabled ? 'allow' : 'deny',
      ]),
    )
    if (overrideMap.size !== originalMap.size) return true
    for (const [id, val] of overrideMap) {
      if (originalMap.get(id) !== val) return true
    }
    return false
  }, [overrideMap, userOverrides])

  const columns = [
    {
      title: '权限',
      dataIndex: 'label',
      key: 'label',
      render: (label: string, record: PermissionRow) => (
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-xs text-gray-400">{record.key}</div>
        </div>
      ),
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 160,
    },
    {
      title: '角色默认',
      key: 'role',
      width: 90,
      render: (_: unknown, record: PermissionRow) => {
        const hasRole = rolePermissionIds.includes(record.id)
        return hasRole ? (
          <Tag color="success">允许</Tag>
        ) : (
          <Tag color="default">无</Tag>
        )
      },
    },
    {
      title: '用户覆盖',
      key: 'override',
      width: 150,
      render: (_: unknown, record: PermissionRow) => {
        const current = overrideMap.get(record.id) ?? 'default'
        return (
          <Select
            size="small"
            value={current}
            options={OVERRIDE_OPTIONS}
            onChange={(val: OverrideValue) => {
              setOverrideMap((prev) => {
                const next = new Map(prev)
                if (val === 'default') next.delete(record.id)
                else next.set(record.id, val)
                return next
              })
            }}
            style={{ width: 120 }}
          />
        )
      },
    },
    {
      title: '最终结果',
      key: 'effective',
      width: 100,
      render: (_: unknown, record: PermissionRow) => {
        const override = overrideMap.get(record.id)
        const hasRole = rolePermissionIds.includes(record.id)
        const effective =
          override === 'allow' ? true : override === 'deny' ? false : hasRole
        return effective ? (
          <Tag color="success">允许</Tag>
        ) : (
          <Tag color="error">拒绝</Tag>
        )
      },
    },
  ]

  const handleSave = () => {
    const overrides: Array<{ permissionId: string; enabled: boolean }> = []
    for (const [permId, val] of overrideMap) {
      overrides.push({ permissionId: permId, enabled: val === 'allow' })
    }
    Modal.confirm({
      title: `保存「${employee.name}」的权限覆盖`,
      content: `将为该用户保存 ${overrides.length} 条权限覆盖记录，确认？`,
      okText: '确认保存',
      cancelText: '取消',
      onOk: () => onSave(overrides),
    })
  }

  if (loadingPerms) {
    return <Skeleton active paragraph={{ rows: 6 }} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button type="text" onClick={onBack}>
          ← 返回用户列表
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            已覆盖 {overrideMap.size} 项
          </span>
          <Button
            type="primary"
            loading={saving}
            disabled={!isDirty}
            onClick={handleSave}
          >
            保存覆盖
          </Button>
        </div>
      </div>

      <Table
        dataSource={allPermissions}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 20 }}
        scroll={{ x: 700 }}
      />
    </div>
  )
}
