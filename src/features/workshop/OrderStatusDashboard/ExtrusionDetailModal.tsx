import { useMemo } from 'react'
import type { TableColumnsType } from 'antd'
import { Modal, Table, Tag } from 'antd'
import dayjs from 'dayjs'

import {
  ExtrusionDetailRow,
  renderDetailQuantity,
  renderText,
  SelectedExtrusionDetail,
} from './dashboardRenderUtils'

export function ExtrusionDetailModal({
  detail,
  onClose,
}: {
  detail: SelectedExtrusionDetail | null
  onClose: () => void
}) {
  const rows = useMemo<ExtrusionDetailRow[]>(
    () =>
      (detail?.record.extrusionDetails ?? []).map((item, index) => ({
        ...item,
        key: `${item.createdAt}-${index}`,
      })),
    [detail],
  )
  const totalTheoreticalCount = rows.reduce(
    (total, item) => total + item.theoreticalOutputCount,
    0,
  )
  const totalActualOutputWeight = rows.reduce(
    (total, item) => total + item.actualOutputWeightKg,
    0,
  )
  const weightedYield =
    totalTheoreticalCount > 0
      ? rows.reduce(
          (sum, item) => sum + item.materialYield * item.theoreticalOutputCount,
          0,
        ) / totalTheoreticalCount
      : 0

  const columns: TableColumnsType<ExtrusionDetailRow> = [
    {
      title: '生产日期',
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: 110,
      fixed: 'left',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      width: 70,
      render: renderText,
    },
    {
      title: '班组长',
      dataIndex: 'shiftLeaderName',
      key: 'shiftLeaderName',
      width: 100,
      render: renderText,
    },
    {
      title: '实际产出长度(mm)',
      dataIndex: 'actualOutputLengthMm',
      key: 'actualOutputLengthMm',
      width: 130,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '订单要求长度(mm)',
      dataIndex: 'orderLengthMm',
      key: 'orderLengthMm',
      width: 130,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '实际产出数量',
      dataIndex: 'actualQuantity',
      key: 'actualQuantity',
      width: 110,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '理论支数',
      dataIndex: 'theoreticalOutputCount',
      key: 'theoreticalOutputCount',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '实际产出重量(kg)',
      dataIndex: 'actualOutputWeightKg',
      key: 'actualOutputWeightKg',
      width: 140,
      align: 'right',
      render: (value: number) => Number(value || 0).toFixed(2),
    },
    {
      title: '成材率(%)',
      dataIndex: 'materialYield',
      key: 'materialYield',
      width: 100,
      align: 'right',
      render: (value: number) => (value > 0 ? `${value.toFixed(2)}%` : '-'),
    },
    {
      title: '审核状态',
      dataIndex: 'isAudited',
      key: 'isAudited',
      width: 90,
      align: 'center',
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'gold'}>
          {value ? '已审核' : '未审核'}
        </Tag>
      ),
    },
  ]

  return (
    <Modal
      open={Boolean(detail)}
      title={
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/30">
            <svg
              className="size-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {detail
                ? `${detail.record.project_no || '-'} 挤压明细`
                : '挤压明细'}
            </span>
          </div>
        </div>
      }
      footer={null}
      width={1180}
      destroyOnHidden
      onCancel={onClose}
      className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-header]:!rounded-t-2xl [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-slate-100 [&_.ant-modal-header]:!bg-gradient-to-r [&_.ant-modal-header]:!from-slate-50 [&_.ant-modal-header]:!to-white dark:[&_.ant-modal-header]:!border-slate-700 dark:[&_.ant-modal-header]:!from-slate-800 dark:[&_.ant-modal-header]:!to-slate-800"
    >
      {detail && (
        <div className="space-y-4">
          {/* 统计摘要 */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 p-3 dark:border-slate-700/60 dark:from-slate-800/60 dark:via-slate-800 dark:to-slate-800/60">
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 px-3 py-1.5 ring-1 ring-amber-100/80 dark:bg-amber-900/30 dark:ring-amber-900/50">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-300">记录</span>
              <span className="text-xs font-bold text-amber-700 tabular-nums dark:text-amber-200">
                {rows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-purple-50/80 px-3 py-1.5 ring-1 ring-purple-100/80 dark:bg-purple-900/30 dark:ring-purple-900/50">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-300">
                理论支数
              </span>
              <span className="text-xs font-bold text-purple-700 tabular-nums dark:text-purple-200">
                {totalTheoreticalCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-orange-50/80 px-3 py-1.5 ring-1 ring-orange-100/80 dark:bg-orange-900/30 dark:ring-orange-900/50">
              <span className="text-xs font-medium text-orange-600 dark:text-orange-300">
                实际重量
              </span>
              <span className="text-xs font-bold text-orange-700 tabular-nums dark:text-orange-200">
                {totalActualOutputWeight.toFixed(2)} kg
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80 dark:bg-emerald-900/30 dark:ring-emerald-900/50">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                加权成材率
              </span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums dark:text-emerald-200">
                {totalTheoreticalCount > 0
                  ? `${weightedYield.toFixed(2)}%`
                  : '-'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-cyan-50/80 px-3 py-1.5 ring-1 ring-cyan-100/80 dark:bg-cyan-900/30 dark:ring-cyan-900/50">
              <span className="text-xs font-medium text-cyan-600 dark:text-cyan-300">已审核</span>
              <span className="text-xs font-bold text-cyan-700 tabular-nums dark:text-cyan-200">
                {rows.filter((item) => item.isAudited).length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-pink-50/80 px-3 py-1.5 ring-1 ring-pink-100/80 dark:bg-pink-900/30 dark:ring-pink-900/50">
              <span className="text-xs font-medium text-pink-600 dark:text-pink-300">未审核</span>
              <span className="text-xs font-bold text-pink-700 tabular-nums dark:text-pink-200">
                {rows.filter((item) => !item.isAudited).length}
              </span>
            </div>
          </div>

          {/* 数据表 */}
          <div className="rounded-xl border border-slate-200/60 bg-white dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-3 py-2 dark:border-slate-700/60 dark:from-slate-800/60 dark:to-transparent">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                挤压记录
              </span>
            </div>
            <Table<ExtrusionDetailRow>
              rowKey="key"
              bordered
              size="small"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: 1060, y: 420 }}
              className="[&_.ant-table]:!rounded-none"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
