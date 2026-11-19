import type { PermissionRow } from '@/services/apiPermissions'
import type { StatusTone } from '@/ui/StatusPill'
import { Input, Select, Table } from 'antd'
import { useMemo, useState } from 'react'
import FilterBar from '@/ui/FilterBar'
import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'
import { zebraRowClassName } from '@/ui/tableStyles'
import { useAllPermissions } from '../RolePermissionList/useRolePermissions'

const SCOPE_LABELS: Record<string, string> = {
  nav: '导航',
  page: '页面',
  feature: '功能',
  field: '字段',
}

const SURFACE_TONES: Record<string, StatusTone> = {
  pc: 'info',
  mobile: 'success',
  both: 'warning',
}

export default function PermissionRegistry() {
  const [keyword, setKeyword] = useState('')
  const [scopeFilter, setScopeFilter] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const { data: allPermissions = [], isLoading } = useAllPermissions()

  const filtered = useMemo(
    () =>
      allPermissions.filter((p) => {
        const matchesKeyword
          = !keyword
            || p.key.toLowerCase().includes(keyword.toLowerCase())
            || p.label.toLowerCase().includes(keyword.toLowerCase())
            || p.module.toLowerCase().includes(keyword.toLowerCase())
        const matchesScope = !scopeFilter || p.scope === scopeFilter
        return matchesKeyword && matchesScope
      }),
    [allPermissions, keyword, scopeFilter],
  )

  const columns = useMemo(
    () => [
      {
        title: '权限 Key',
        dataIndex: 'key',
        key: 'key',
        render: (key: string) => (
          <span className="font-mono text-xs">{key}</span>
        ),
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
        render: (scope: string) => (
          <StatusPill tone="neutral">{SCOPE_LABELS[scope] ?? scope}</StatusPill>
        ),
      },
      {
        title: '端',
        dataIndex: 'surface',
        key: 'surface',
        width: 80,
        render: (surface: string) => (
          <StatusPill tone={SURFACE_TONES[surface] ?? 'neutral'}>
            {surface}
          </StatusPill>
        ),
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        render: (desc: string | null) =>
          desc ?? <span className="text-slate-400 dark:text-slate-500">—</span>,
      },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-3">
      <FilterBar className="flex flex-wrap items-center gap-3">
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
        <span className="text-sm text-slate-400 dark:text-slate-500">
          共 {filtered.length} / {allPermissions.length} 项
        </span>
      </FilterBar>

      <Table<PermissionRow>
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        rowClassName={zebraRowClassName}
        locale={{
          emptyText: (
            <TableEmpty
              title="暂无权限注册项"
              description="请尝试调整搜索关键词或筛选范围"
            />
          ),
        }}
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
