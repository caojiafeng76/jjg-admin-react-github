import type { TableColumnsType } from 'antd'
import type {
  PrecisionCuttingDetailRow,
  SelectedPrecisionCuttingDetail,
} from './dashboardRenderUtils'
import { ScissorsIcon } from '@heroicons/react/16/solid'
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

export function PrecisionCuttingDetailModal({
  detail,
  onClose,
}: {
  detail: SelectedPrecisionCuttingDetail | null
  onClose: () => void
}) {
  const rows = useMemo<PrecisionCuttingDetailRow[]>(
    () =>
      (detail?.record.precisionCuttingDetails ?? []).map(item => ({
        ...item,
        key: item.id,
      })),
    [detail],
  )
  const summary = useMemo(
    () => ({
      auditedCount: rows.filter(item => item.isAudited).length,
      defectQuantity: rows.reduce(
        (total, item) =>
          total
          + item.rawMaterialDefectCount
          + item.processingDefectCount
          + item.outsourceDefectQuantity,
        0,
      ),
      longMaterialQuantity: rows.reduce(
        (total, item) => total + item.longMaterialQuantity,
        0,
      ),
      transferQuantity: rows.reduce(
        (total, item) => total + item.transferQuantity,
        0,
      ),
      unauditedCount: rows.filter(item => !item.isAudited).length,
    }),
    [rows],
  )
  const columns: TableColumnsType<PrecisionCuttingDetailRow> = [
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
      width: 100,
      render: renderText,
    },
    {
      title: '精切数量',
      dataIndex: 'transferQuantity',
      key: 'transferQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '长料长度',
      dataIndex: 'longMaterialLengthMm',
      key: 'longMaterialLengthMm',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '长料支数',
      dataIndex: 'longMaterialQuantity',
      key: 'longMaterialQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '原料不良',
      dataIndex: 'rawMaterialDefectCount',
      key: 'rawMaterialDefectCount',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '加工不良',
      dataIndex: 'processingDefectCount',
      key: 'processingDefectCount',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '外协不良',
      dataIndex: 'outsourceDefectQuantity',
      key: 'outsourceDefectQuantity',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '不良原因',
      dataIndex: 'defectReason',
      key: 'defectReason',
      width: 120,
      render: renderText,
    },
    {
      title: '责任工序',
      dataIndex: 'responsibleProcess',
      key: 'responsibleProcess',
      width: 110,
      render: renderText,
    },
    {
      title: '责任人',
      dataIndex: 'processOwner',
      key: 'processOwner',
      width: 100,
      render: renderText,
    },
    {
      title: '操作人',
      dataIndex: 'operatorNames',
      key: 'operatorNames',
      width: 140,
      render: (value: string[]) => renderText(value.join('、')),
    },
    {
      title: '接收人',
      dataIndex: 'recipientName',
      key: 'recipientName',
      width: 100,
      render: renderText,
    },
    {
      title: '审核状态',
      dataIndex: 'isAudited',
      key: 'isAudited',
      width: 90,
      align: 'center',
      render: (value: boolean) => (
        <StatusPill tone={value ? 'success' : 'warning'}>
          {value ? '已审核' : '未审核'}
        </StatusPill>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 160,
      render: renderText,
    },
  ]

  return (
    <Modal
      open={Boolean(detail)}
      title={(
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
            <ScissorsIcon className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {detail
                ? `${detail.record.project_no || '-'} 精切明细`
                : '精切明细'}
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
            <div className="flex items-center gap-1.5 rounded-lg bg-cyan-50/80 px-3 py-1.5 ring-1 ring-cyan-100/80 dark:bg-cyan-900/30 dark:ring-cyan-900/50">
              <span className="text-xs font-medium text-cyan-600 dark:text-cyan-300">记录</span>
              <span className="text-xs font-bold text-cyan-700 tabular-nums dark:text-cyan-200">
                {rows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-purple-50/80 px-3 py-1.5 ring-1 ring-purple-100/80 dark:bg-purple-900/30 dark:ring-purple-900/50">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-300">精切</span>
              <span className="text-xs font-bold text-purple-700 tabular-nums dark:text-purple-200">
                {summary.transferQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-teal-50/80 px-3 py-1.5 ring-1 ring-teal-100/80 dark:bg-teal-900/30 dark:ring-teal-900/50">
              <span className="text-xs font-medium text-teal-600 dark:text-teal-300">长料</span>
              <span className="text-xs font-bold text-teal-700 tabular-nums dark:text-teal-200">
                {summary.longMaterialQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50/80 px-3 py-1.5 ring-1 ring-red-100/80 dark:bg-red-900/30 dark:ring-red-900/50">
              <span className="text-xs font-medium text-red-600 dark:text-red-300">不良</span>
              <span className="text-xs font-bold text-red-700 tabular-nums dark:text-red-200">
                {summary.defectQuantity.toLocaleString()}
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
                精切记录
              </span>
            </div>
            <Table<PrecisionCuttingDetailRow>
              rowKey="key"
              bordered
              size="small"
              columns={columns}
              dataSource={rows}
              rowClassName={zebraRowClassName}
              locale={{ emptyText: <TableEmpty title="暂无精切明细" /> }}
              pagination={false}
              scroll={{ x: 1640, y: 420 }}
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
