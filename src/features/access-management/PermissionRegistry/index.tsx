import { useState } from 'react'
import { Input, Select, Table, Tag } from 'antd'
import { useAllPermissions } from '../RolePermissionList/useRolePermissions'
import type { PermissionRow } from '@/services/apiPermissions'

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

export default function PermissionRegistry() {
  const [keyword, setKeyword] = useState('')
  const [scopeFilter, setScopeFilter] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: allPermissions = [], isLoading } = useAllPermissions()

  const filtered = allPermissions.filter((p) => {
    const matchesKeyword =
      !keyword ||
      p.key.toLowerCase().includes(keyword.toLowerCase()) ||
      p.label.toLowerCase().includes(keyword.toLowerCase()) ||
      p.module.toLowerCase().includes(keyword.toLowerCase())
    const matchesScope = !scopeFilter || p.scope === scopeFilter
    return matchesKeyword && matchesScope
  })

  const columns = [
    {
      title: '权限 Key',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => <span className="font-mono text-xs">{key}</span>,
    },
    {
      title: '名称',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 160,
    },
    {
      title: '范围',
      dataIndex: 'scope',
      key: 'scope',
      width: 80,
      render: (scope: string) => <Tag>{SCOPE_LABELS[scope] ?? scope}</Tag>,
    },
    {
      title: '端',
      dataIndex: 'surface',
      key: 'surface',
      width: 80,
      render: (surface: string) => (
        <Tag color={SURFACE_COLORS[surface]}>{surface}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string | null) =>
        desc ?? <span className="text-gray-400">—</span>,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input.Search
          placeholder="搜索 key / 名称 / 模块"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setPage(1)
          }}
          allowClear
          style={{ maxWidth: 280 }}
        />
        <Select
          placeholder="按范围筛选"
          value={scopeFilter}
          onChange={(value) => {
            setScopeFilter(value)
            setPage(1)
          }}
          allowClear
          style={{ width: 140 }}
          options={Object.entries(SCOPE_LABELS).map(([val, label]) => ({
            label,
            value: val,
          }))}
        />
        <span className="text-sm text-gray-400">
          共 {filtered.length} / {allPermissions.length} 项
        </span>
      </div>

      <Table<PermissionRow>
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        pagination={{
          current: page,
          pageSize,
          total: filtered.length,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          onChange: (nextPage, nextSize) => {
            setPage(nextPage)
            setPageSize(nextSize)
          },
        }}
        scroll={{ x: 800 }}
      />
    </div>
  )
}
