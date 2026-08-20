import { Button, Checkbox, theme } from 'antd'

import type { ToolingFixture } from '@/services/apiToolingFixture'
import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'
import {
  formatDateOnly,
  getLifecycleTone,
  getStatusTone,
} from './toolingFixturePresentation'

interface ToolingFixtureMobileListProps {
  data: ToolingFixture[]
  loading: boolean
  selectedRowKeys: React.Key[]
  onSelect: (keys: React.Key[]) => void
  onEdit: (record: ToolingFixture) => void
  onDelete: (record: ToolingFixture) => void
  onPrint: (record: ToolingFixture) => void
  emptyAction?: React.ReactNode
}

export default function ToolingFixtureMobileList({
  data,
  loading,
  selectedRowKeys,
  onSelect,
  onEdit,
  onDelete,
  onPrint,
  emptyAction,
}: ToolingFixtureMobileListProps) {
  const { token } = theme.useToken()

  if (data.length === 0) {
    return (
      <TableEmpty
        title="暂无工装资料"
        description="点击下方按钮创建第一条工装资料"
        action={emptyAction}
      />
    )
  }

  return (
    <div
      aria-busy={loading}
      className="space-y-3"
      data-testid="tooling-fixture-mobile-list"
    >
      {data.map((record) => {
        const isSelected = selectedRowKeys.includes(record.id)

        return (
          <article
            key={record.id}
            aria-label={`工装资料 ${record.fixture_no}`}
            className="rounded-xl border p-3 shadow-sm"
            style={{
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorder,
              color: token.colorText,
            }}
          >
            <div className="flex items-start gap-2">
              <Checkbox
                checked={isSelected}
                aria-label={`选择工装 ${record.fixture_no}`}
                onChange={(event) => {
                  const nextKeys = event.target.checked
                    ? [...selectedRowKeys, record.id]
                    : selectedRowKeys.filter((key) => key !== record.id)
                  onSelect(nextKeys)
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{record.fixture_no}</p>
                <p
                  className="mt-0.5 truncate text-sm"
                  style={{ color: token.colorTextSecondary }}
                >
                  {record.product_name || '未填写产品名称'}
                </p>
              </div>
            </div>

            <div
              className="mt-3 grid grid-cols-2 gap-2 rounded-lg p-2"
              style={{ backgroundColor: token.colorFillAlter }}
            >
              <div>
                <p
                  className="text-xs"
                  style={{ color: token.colorTextTertiary }}
                >
                  状态
                </p>
                <StatusPill tone={getStatusTone(record.status)}>
                  {record.status}
                </StatusPill>
              </div>
              <div>
                <p
                  className="text-xs"
                  style={{ color: token.colorTextTertiary }}
                >
                  寿命
                </p>
                <StatusPill tone={getLifecycleTone(record.lifecycle)}>
                  {record.lifecycle}
                </StatusPill>
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs"
                  style={{ color: token.colorTextTertiary }}
                >
                  存放位置
                </p>
                <p
                  className="truncate text-sm"
                  style={{ color: token.colorTextSecondary }}
                >
                  {record.storage_location || '-'}
                </p>
              </div>
              <div>
                <p
                  className="text-xs"
                  style={{ color: token.colorTextTertiary }}
                >
                  更新日期
                </p>
                <p
                  className="text-sm tabular-nums"
                  style={{ color: token.colorTextSecondary }}
                >
                  {formatDateOnly(record.updated_at)}
                </p>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-1">
              <Button type="link" size="small" onClick={() => onPrint(record)}>
                打印
              </Button>
              <Button type="link" size="small" onClick={() => onEdit(record)}>
                编辑
              </Button>
              <Button
                type="link"
                danger
                size="small"
                onClick={() => onDelete(record)}
              >
                删除
              </Button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
