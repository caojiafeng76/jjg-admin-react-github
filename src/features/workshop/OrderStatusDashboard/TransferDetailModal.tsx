import type { TableColumnsType } from 'antd'
import type {
  SelectedTransferDetail,
  TransferDetailRow,
} from './dashboardRenderUtils'
import { ArrowsRightLeftIcon } from '@heroicons/react/16/solid'
import { Modal, Table } from 'antd'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import StatusPill from '@/ui/StatusPill'
import { TableEmpty } from '@/ui/TableState'

import { zebraRowClassName } from '@/ui/tableStyles'
import {
  renderDetailQuantity,
  renderText,
} from './dashboardRenderUtils'

export function TransferDetailModal({
  detail,
  onClose,
}: {
  detail: SelectedTransferDetail | null
  onClose: () => void
}) {
  const rows = useMemo<TransferDetailRow[]>(
    () =>
      (detail?.record.transferDetails ?? []).map((item, index) => ({
        ...item,
        key: `${item.createdAt}-${index}`,
      })),
    [detail],
  )
  const summary = useMemo(
    () => ({
      auditedCount: rows.filter(item => item.isAudited).length,
      transferQuantity: rows.reduce(
        (total, item) => total + item.transferQuantity,
        0,
      ),
      unauditedCount: rows.filter(item => !item.isAudited).length,
    }),
    [rows],
  )
  const columns: TableColumnsType<TransferDetailRow> = [
    {
      title: '转移时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      fixed: 'left',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '接收车间',
      dataIndex: 'targetWorkshop',
      key: 'targetWorkshop',
      width: 120,
      render: renderText,
    },
    {
      title: '转移数量',
      dataIndex: 'transferQuantity',
      key: 'transferQuantity',
      width: 110,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '操作人',
      dataIndex: 'operatorNames',
      key: 'operatorNames',
      width: 180,
      render: (value: string[]) => renderText(value.join('、')),
    },
    {
      title: '接收人',
      dataIndex: 'recipientName',
      key: 'recipientName',
      width: 120,
      render: renderText,
    },
    {
      title: '审核状态',
      dataIndex: 'isAudited',
      key: 'isAudited',
      width: 100,
      align: 'center',
      render: (value: boolean) => (
        <StatusPill tone={value ? 'success' : 'warning'}>
          {value ? '已审核' : '未审核'}
        </StatusPill>
      ),
    },
  ]

  return (
    <Modal
      open={Boolean(detail)}
      title={(
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <ArrowsRightLeftIcon className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {detail
                ? `${detail.record.project_no || '-'} 物料转移明细`
                : '物料转移明细'}
            </span>
          </div>
        </div>
      )}
      footer={null}
      width={960}
      destroyOnHidden
      onCancel={onClose}
    >
      {detail && (
        <div className="space-y-4">
          {/* 统计摘要 */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 p-3 dark:border-slate-700/60 dark:from-slate-800/60 dark:via-slate-800 dark:to-slate-800/60">
            <div className="flex items-center gap-1.5 rounded-lg bg-purple-50/80 px-3 py-1.5 ring-1 ring-purple-100/80 dark:bg-purple-900/30 dark:ring-purple-900/50">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-300">记录</span>
              <span className="text-xs font-bold text-purple-700 tabular-nums dark:text-purple-200">
                {rows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-pink-50/80 px-3 py-1.5 ring-1 ring-pink-100/80 dark:bg-pink-900/30 dark:ring-pink-900/50">
              <span className="text-xs font-medium text-pink-600 dark:text-pink-300">转移</span>
              <span className="text-xs font-bold text-pink-700 tabular-nums dark:text-pink-200">
                {summary.transferQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80 dark:bg-emerald-900/30 dark:ring-emerald-900/50">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                已审核
              </span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums dark:text-emerald-200">
                {summary.auditedCount}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 px-3 py-1.5 ring-1 ring-amber-100/80 dark:bg-amber-900/30 dark:ring-amber-900/50">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-300">未审核</span>
              <span className="text-xs font-bold text-amber-700 tabular-nums dark:text-amber-200">
                {summary.unauditedCount}
              </span>
            </div>
          </div>

          {/* 数据表 */}
          <div className="rounded-xl border border-slate-200/60 bg-white dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-3 py-2 dark:border-slate-700/60 dark:from-slate-800/60 dark:to-transparent">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                转移记录
              </span>
            </div>
            <Table<TransferDetailRow>
              rowKey="key"
              bordered
              size="small"
              columns={columns}
              dataSource={rows}
              rowClassName={zebraRowClassName}
              locale={{ emptyText: <TableEmpty title="暂无物料转移明细" /> }}
              pagination={false}
              scroll={{ x: 780, y: 420 }}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
