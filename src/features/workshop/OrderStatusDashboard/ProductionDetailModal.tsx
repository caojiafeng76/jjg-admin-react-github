import { useMemo } from 'react'
import type { TableColumnsType } from 'antd'
import { Modal, Table } from 'antd'
import dayjs from 'dayjs'

import { isViewerRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { getColumnKey, getTableColumnWidth } from './dashboardUtils'
import {
  OperationSummaryRow,
  ProductionDetailRow,
  renderDetailQuantity,
  renderHours,
  renderText,
  SelectedJobDetail,
  VIEWER_PRODUCTION_DETAIL_HIDDEN_COLUMN_KEYS,
} from './dashboardRenderUtils'

export function ProductionDetailModal({
  detail,
  onClose,
}: {
  detail: SelectedJobDetail | null
  onClose: () => void
}) {
  const { role } = useAuth()
  const isViewer = isViewerRole(role)
  const rows = useMemo<ProductionDetailRow[]>(
    () =>
      (detail?.record.productionDetails ?? [])
        .filter((item) => item.jobName === detail?.jobName)
        .map((item) => ({ ...item, key: item.id })),
    [detail],
  )
  const operationSummaryRows = useMemo<OperationSummaryRow[]>(() => {
    const summaryMap = new Map<string, OperationSummaryRow>()

    for (const row of rows) {
      const operation = row.operation || '-'
      const current = summaryMap.get(operation) ?? {
        detailCount: 0,
        key: operation,
        operation,
        qualifiedQuantity: 0,
      }

      current.detailCount += 1
      current.qualifiedQuantity += row.qualifiedQuantity
      summaryMap.set(operation, current)
    }

    return Array.from(summaryMap.values()).sort((left, right) =>
      left.operation.localeCompare(right.operation),
    )
  }, [rows])
  const summary = useMemo(
    () => ({
      defectQuantity: rows.reduce(
        (total, item) => total + item.defectQuantity,
        0,
      ),
      incomingQuantity: rows.reduce(
        (total, item) => total + item.incomingQualifiedQuantity,
        0,
      ),
      qualifiedQuantity: rows.reduce(
        (total, item) => total + item.qualifiedQuantity,
        0,
      ),
    }),
    [rows],
  )
  const operationSummaryColumns: TableColumnsType<OperationSummaryRow> = [
    {
      title: '工序',
      dataIndex: 'operation',
      key: 'operation',
      width: 160,
      render: renderText,
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQuantity',
      key: 'qualifiedQuantity',
      width: 120,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '明细数',
      dataIndex: 'detailCount',
      key: 'detailCount',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
  ]
  const baseColumns: TableColumnsType<ProductionDetailRow> = [
    {
      title: '日期',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 110,
      fixed: 'left',
      render: renderText,
    },
    {
      title: '班次',
      dataIndex: 'shift',
      key: 'shift',
      width: 80,
      render: renderText,
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
      render: renderText,
    },
    {
      title: '岗位',
      dataIndex: 'jobName',
      key: 'jobName',
      width: 110,
      render: renderText,
    },
    {
      title: '工序',
      dataIndex: 'operation',
      key: 'operation',
      width: 100,
      render: renderText,
    },
    {
      title: '型号',
      dataIndex: 'productModel',
      key: 'productModel',
      width: 110,
      render: renderText,
    },
    {
      title: '客户型号',
      dataIndex: 'customerModel',
      key: 'customerModel',
      width: 120,
      render: renderText,
    },
    {
      title: '长度',
      dataIndex: 'lengthMm',
      key: 'lengthMm',
      width: 90,
      align: 'right',
      render: renderText,
    },
    {
      title: '设备',
      key: 'machine',
      width: 150,
      render: (_value, item) =>
        renderText(
          [item.unifiedDeviceNo, item.machineName].filter(Boolean).join(' / '),
        ),
    },
    {
      title: '来料接收数',
      dataIndex: 'incomingQualifiedQuantity',
      key: 'incomingQualifiedQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '合格数量',
      dataIndex: 'qualifiedQuantity',
      key: 'qualifiedQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '不合格数量',
      dataIndex: 'defectQuantity',
      key: 'defectQuantity',
      width: 100,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '加工不良',
      dataIndex: 'defectQuantity1',
      key: 'defectQuantity1',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '加工原因',
      dataIndex: 'defectReason1',
      key: 'defectReason1',
      width: 120,
      render: renderText,
    },
    {
      title: '原料不良',
      dataIndex: 'defectQuantity2',
      key: 'defectQuantity2',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '原料原因',
      dataIndex: 'defectReason2',
      key: 'defectReason2',
      width: 120,
      render: renderText,
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
      title: '外协原因',
      dataIndex: 'outsourceDefectReason',
      key: 'outsourceDefectReason',
      width: 120,
      render: renderText,
    },
    {
      title: '外协单位',
      dataIndex: 'outsourceUnit',
      key: 'outsourceUnit',
      width: 120,
      render: renderText,
    },
    {
      title: '调机不良',
      dataIndex: 'setupDefectQuantity',
      key: 'setupDefectQuantity',
      width: 90,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '调机负责人',
      dataIndex: 'setupResponsible',
      key: 'setupResponsible',
      width: 120,
      render: renderText,
    },
    {
      title: '标准工时(秒)',
      dataIndex: 'standardSeconds',
      key: 'standardSeconds',
      width: 110,
      align: 'right',
      render: renderDetailQuantity,
    },
    {
      title: '合格工时(h)',
      dataIndex: 'qualifiedHours',
      key: 'qualifiedHours',
      width: 110,
      align: 'right',
      render: renderHours,
    },
    {
      title: '减分工时(h)',
      dataIndex: 'defectHours',
      key: 'defectHours',
      width: 110,
      align: 'right',
      render: renderHours,
    },
    {
      title: '工时(h)',
      dataIndex: 'workHours',
      key: 'workHours',
      width: 90,
      align: 'right',
      render: renderHours,
    },
    {
      title: '数据类别',
      dataIndex: 'dataCategory',
      key: 'dataCategory',
      width: 90,
      render: renderText,
    },
    {
      title: '录入时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 180,
      render: renderText,
    },
  ]
  const columns: TableColumnsType<ProductionDetailRow> = isViewer
    ? baseColumns.filter(
        (column) =>
          !VIEWER_PRODUCTION_DETAIL_HIDDEN_COLUMN_KEYS.has(
            getColumnKey(column),
          ),
      )
    : baseColumns
  const productionDetailScrollX = getTableColumnWidth(columns)

  return (
    <Modal
      open={Boolean(detail)}
      title={
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/30">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {detail
                ? `${detail.record.project_no || '-'} / ${detail.jobName} 岗位生产工单明细`
                : '生产工单明细'}
            </span>
          </div>
        </div>
      }
      footer={null}
      width={1280}
      destroyOnHidden
      onCancel={onClose}
      className="[&_.ant-modal-content]:!rounded-2xl [&_.ant-modal-header]:!rounded-t-2xl [&_.ant-modal-header]:!border-b [&_.ant-modal-header]:!border-slate-100 [&_.ant-modal-header]:!bg-gradient-to-r [&_.ant-modal-header]:!from-slate-50 [&_.ant-modal-header]:!to-white dark:[&_.ant-modal-header]:!border-slate-700 dark:[&_.ant-modal-header]:!from-slate-800 dark:[&_.ant-modal-header]:!to-slate-800"
    >
      {detail && (
        <div className="space-y-4">
          {/* 统计摘要 */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 p-3 dark:border-slate-700/60 dark:from-slate-800/60 dark:via-slate-800 dark:to-slate-800/60">
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-50/80 px-3 py-1.5 ring-1 ring-blue-100/80 dark:bg-blue-900/30 dark:ring-blue-900/50">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-300">明细</span>
              <span className="text-xs font-bold text-blue-700 tabular-nums dark:text-blue-200">
                {rows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-cyan-50/80 px-3 py-1.5 ring-1 ring-cyan-100/80 dark:bg-cyan-900/30 dark:ring-cyan-900/50">
              <span className="text-xs font-medium text-cyan-600 dark:text-cyan-300">工序</span>
              <span className="text-xs font-bold text-cyan-700 tabular-nums dark:text-cyan-200">
                {operationSummaryRows.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50/80 px-3 py-1.5 ring-1 ring-emerald-100/80 dark:bg-emerald-900/30 dark:ring-emerald-900/50">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">合格</span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums dark:text-emerald-200">
                {summary.qualifiedQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50/80 px-3 py-1.5 ring-1 ring-amber-100/80 dark:bg-amber-900/30 dark:ring-amber-900/50">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-300">来料</span>
              <span className="text-xs font-bold text-amber-700 tabular-nums dark:text-amber-200">
                {summary.incomingQuantity.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50/80 px-3 py-1.5 ring-1 ring-red-100/80 dark:bg-red-900/30 dark:ring-red-900/50">
              <span className="text-xs font-medium text-red-600 dark:text-red-300">不合格</span>
              <span className="text-xs font-bold text-red-700 tabular-nums dark:text-red-200">
                {summary.defectQuantity.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 工序汇总表 */}
          <div className="rounded-xl border border-slate-200/60 bg-white dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-3 py-2 dark:border-slate-700/60 dark:from-slate-800/60 dark:to-transparent">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                工序汇总
              </span>
            </div>
            <Table<OperationSummaryRow>
              rowKey="key"
              bordered
              size="small"
              columns={operationSummaryColumns}
              dataSource={operationSummaryRows}
              pagination={false}
              scroll={{ x: 370 }}
              className="[&_.ant-table]:!rounded-none"
            />
          </div>

          {/* 详细数据表 */}
          <div className="rounded-xl border border-slate-200/60 bg-white dark:border-slate-700/60 dark:bg-slate-800/80">
            <div className="border-b border-slate-100/60 bg-gradient-to-r from-slate-50/50 to-transparent px-3 py-2 dark:border-slate-700/60 dark:from-slate-800/60 dark:to-transparent">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                详细记录
              </span>
            </div>
            <Table<ProductionDetailRow>
              rowKey="key"
              bordered
              size="small"
              columns={columns}
              dataSource={rows}
              pagination={false}
              scroll={{ x: productionDetailScrollX, y: 360 }}
              className="[&_.ant-table]:!rounded-none"
            />
          </div>
        </div>
      )}
    </Modal>
  )
}
