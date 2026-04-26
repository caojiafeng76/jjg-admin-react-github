import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import type { TableColumnsType } from 'antd'
import { Button, Input, Modal, Space, Table, Tabs, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'

import type { WorkshopOrderStatus } from '@/features/workshop/OrderList/orderStatus'
import { useTableHeight } from '@/hooks/useTableHeight'
import type {
  OrderProductionStatus,
  OrderStatusDashboardItem,
  OrderStatusMaterialTransferDetail,
  OrderStatusProductionDetail,
} from '@/services/apiOrderStatusDashboard'
import AppPagination from '@/ui/AppPagination'
import { useOrderStatusDashboard } from './useOrderStatusDashboard'

const { Text, Title } = Typography

const DEFAULT_PAGE_SIZE = 20

const STATUS_COLOR: Record<OrderProductionStatus, string> = {
  正常: 'green',
  预警: 'gold',
  延期: 'red',
}

const JOB_OUTPUT_COLUMN_WIDTH = 96
const BASE_TABLE_WIDTH = 1294
const STATUS_TABLE_WIDTH = 1070

type ProductionDetailRow = OrderStatusProductionDetail & {
  key: string
}

type TransferDetailRow = OrderStatusMaterialTransferDetail & {
  key: string
}

type OperationSummaryRow = {
  detailCount: number
  key: string
  operation: string
  qualifiedQuantity: number
}

type SelectedJobDetail = {
  jobName: string
  record: OrderStatusDashboardItem
}

type SelectedTransferDetail = {
  record: OrderStatusDashboardItem
}

type SearchValues = {
  model: string
  orderDate: string
  projectNo: string
}

const EMPTY_SEARCH_VALUES: SearchValues = {
  model: '',
  orderDate: '',
  projectNo: '',
}

const STATUS_TABS: Array<{ key: WorkshopOrderStatus; label: string }> = [
  { key: '生产中', label: '生产中' },
  { key: '已结案', label: '已结案' },
]

function normalizeStatusTab(value: string | null): WorkshopOrderStatus {
  return value === '已结案' ? '已结案' : '生产中'
}

function renderText(value: string | number | null | undefined) {
  const text =
    value === null || value === undefined || value === '' ? '-' : value

  return (
    <span
      className="block leading-tight wrap-break-word whitespace-normal"
      title={String(text)}
    >
      {text}
    </span>
  )
}

function renderQuantity(value: number | null | undefined) {
  const normalizedValue = Number(value || 0)

  if (normalizedValue <= 0) {
    return <Text type="secondary">-</Text>
  }

  return <Text strong>{normalizedValue.toLocaleString()}</Text>
}

function renderDetailQuantity(value: number | null | undefined) {
  return Number(value || 0).toLocaleString()
}

function renderPercent(value: number | null) {
  if (value === null) {
    return <Text type="secondary">-</Text>
  }

  return `${value}%`
}

function renderHours(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return <Text type="secondary">-</Text>
  }

  return value.toFixed(2)
}

function renderTransferWorkshops(value: string[]) {
  if (value.length === 0) {
    return <Text type="secondary">-</Text>
  }

  return (
    <Space size={4} wrap>
      {value.map((workshop) => (
        <Tag key={workshop}>{workshop}</Tag>
      ))}
    </Space>
  )
}

function renderLatestTransfer(
  _value: string | null,
  record: OrderStatusDashboardItem,
) {
  if (!record.latestTransferAt) {
    return <Text type="secondary">-</Text>
  }

  const summary = [
    record.latestTransferWorkshop,
    record.latestTransferOperatorNames.join('、'),
  ]
    .filter(Boolean)
    .join(' / ')

  return (
    <div className="leading-tight">
      <div>{dayjs(record.latestTransferAt).format('MM-DD HH:mm')}</div>
      {summary && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {summary}
        </Text>
      )}
    </div>
  )
}

function renderTransferQuantityCell({
  onOpen,
  record,
}: {
  onOpen: (record: OrderStatusDashboardItem) => void
  record: OrderStatusDashboardItem
}) {
  const quantity = Number(record.transferQuantity || 0)

  if (quantity <= 0) {
    return <Text type="secondary">-</Text>
  }

  if (record.transferDetails.length === 0) {
    return <Text strong>{quantity.toLocaleString()}</Text>
  }

  return (
    <Button
      type="link"
      size="small"
      className="h-auto! px-0! font-semibold!"
      onClick={(event) => {
        event.stopPropagation()
        onOpen(record)
      }}
    >
      {quantity.toLocaleString()}
    </Button>
  )
}

function renderJobOutputCell({
  jobName,
  onOpen,
  record,
}: {
  jobName: string
  onOpen: (record: OrderStatusDashboardItem, jobName: string) => void
  record: OrderStatusDashboardItem
}) {
  const quantity = Number(record.jobOutputs[jobName] || 0)
  const detailCount = record.productionDetails.filter(
    (item) => item.jobName === jobName,
  ).length

  if (quantity <= 0) {
    return <Text type="secondary">-</Text>
  }

  if (detailCount === 0) {
    return <Text strong>{quantity.toLocaleString()}</Text>
  }

  return (
    <Button
      type="link"
      size="small"
      className="h-auto! px-0! font-semibold!"
      onClick={(event) => {
        event.stopPropagation()
        onOpen(record, jobName)
      }}
    >
      {quantity.toLocaleString()}
    </Button>
  )
}

function ProductionDetailModal({
  detail,
  onClose,
}: {
  detail: SelectedJobDetail | null
  onClose: () => void
}) {
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
  const columns: TableColumnsType<ProductionDetailRow> = [
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

  return (
    <Modal
      open={Boolean(detail)}
      title={
        detail
          ? `${detail.record.project_no || '-'} / ${detail.jobName} 岗位生产工单明细`
          : '生产工单明细'
      }
      footer={null}
      width={1280}
      destroyOnHidden
      onCancel={onClose}
    >
      {detail && (
        <div className="space-y-4">
          <Space size={8} wrap>
            <Tag color="blue">明细 {rows.length}</Tag>
            <Tag color="cyan">工序 {operationSummaryRows.length}</Tag>
            <Tag color="green">
              合格 {summary.qualifiedQuantity.toLocaleString()}
            </Tag>
            <Tag color="gold">
              来料 {summary.incomingQuantity.toLocaleString()}
            </Tag>
            <Tag color={summary.defectQuantity > 0 ? 'red' : 'default'}>
              不合格 {summary.defectQuantity.toLocaleString()}
            </Tag>
          </Space>

          <Table<OperationSummaryRow>
            rowKey="key"
            bordered
            size="small"
            columns={operationSummaryColumns}
            dataSource={operationSummaryRows}
            pagination={false}
            scroll={{ x: 370 }}
          />

          <Table<ProductionDetailRow>
            rowKey="key"
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 2710, y: 360 }}
          />
        </div>
      )}
    </Modal>
  )
}

function TransferDetailModal({
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
      auditedCount: rows.filter((item) => item.isAudited).length,
      transferQuantity: rows.reduce(
        (total, item) => total + item.transferQuantity,
        0,
      ),
      unauditedCount: rows.filter((item) => !item.isAudited).length,
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
        detail
          ? `${detail.record.project_no || '-'} 物料转移明细`
          : '物料转移明细'
      }
      footer={null}
      width={920}
      destroyOnHidden
      onCancel={onClose}
    >
      {detail && (
        <div className="space-y-4">
          <Space size={8} wrap>
            <Tag color="blue">记录 {rows.length}</Tag>
            <Tag color="purple">
              转移 {summary.transferQuantity.toLocaleString()}
            </Tag>
            <Tag color="green">已审核 {summary.auditedCount}</Tag>
            <Tag color={summary.unauditedCount > 0 ? 'gold' : 'default'}>
              未审核 {summary.unauditedCount}
            </Tag>
          </Space>

          <Table<TransferDetailRow>
            rowKey="key"
            bordered
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 780, y: 420 }}
          />
        </div>
      )}
    </Modal>
  )
}

export default function OrderStatusDashboard() {
  const [selectedJobDetail, setSelectedJobDetail] =
    useState<SelectedJobDetail | null>(null)
  const [selectedTransferDetail, setSelectedTransferDetail] =
    useState<SelectedTransferDetail | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE
  const activeStatus = normalizeStatusTab(searchParams.get('status'))
  const searchParamValues = useMemo<SearchValues>(
    () => ({
      orderDate: searchParams.get('orderDate')?.trim() ?? '',
      projectNo: searchParams.get('projectNo')?.trim() ?? '',
      model: searchParams.get('model')?.trim() ?? '',
    }),
    [searchParams],
  )
  const [searchValues, setSearchValues] =
    useState<SearchValues>(searchParamValues)
  const filters = useMemo(
    () => ({
      orderDate: searchParamValues.orderDate || undefined,
      projectNo: searchParamValues.projectNo || undefined,
      model: searchParamValues.model || undefined,
      status: activeStatus,
    }),
    [activeStatus, searchParamValues],
  )
  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: Math.min(pageSize, 12),
      minRowHeight: 34,
    })
  const { data, isLoading, isFetching, refetch } = useOrderStatusDashboard({
    page,
    pageSize,
    filters,
  })
  const isDataLoading = isLoading || isFetching

  const rows = data?.items ?? []
  const jobColumns = data?.jobColumns ?? []
  const openJobDetail = useCallback(
    (record: OrderStatusDashboardItem, jobName: string) => {
      setSelectedJobDetail({ record, jobName })
    },
    [],
  )
  const openTransferDetail = useCallback((record: OrderStatusDashboardItem) => {
    setSelectedTransferDetail({ record })
  }, [])

  const columns = useMemo<TableColumnsType<OrderStatusDashboardItem>>(() => {
    const baseColumns: TableColumnsType<OrderStatusDashboardItem> = [
      {
        title: '序号',
        key: 'index',
        width: 64,
        fixed: 'left',
        align: 'center',
        render: (_value, _record, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        key: 'project_no',
        width: 180,
        fixed: 'left',
        render: renderText,
      },
      {
        title: '客户',
        dataIndex: 'customer',
        key: 'customer',
        width: 120,
        render: renderText,
      },
      {
        title: '型号',
        dataIndex: 'product_model',
        key: 'product_model',
        width: 130,
        render: renderText,
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        key: 'customer_model',
        width: 150,
        render: renderText,
      },
      {
        title: '订单日期',
        dataIndex: 'product_delivery_date',
        key: 'product_delivery_date',
        width: 120,
        render: renderText,
      },
      {
        title: '料号',
        dataIndex: 'material_code',
        key: 'material_code',
        width: 150,
        render: renderText,
      },
      {
        title: '图材质',
        dataIndex: 'material_name',
        key: 'material_name',
        width: 120,
        render: renderText,
      },
      {
        title: '工艺流程',
        dataIndex: 'process_flow',
        key: 'process_flow',
        width: 160,
        render: renderText,
      },
      {
        title: '订单数量',
        dataIndex: 'order_quantity',
        key: 'order_quantity',
        width: 100,
        align: 'right',
        render: renderQuantity,
      },
    ]

    const outputColumns: TableColumnsType<OrderStatusDashboardItem> =
      jobColumns.map((column) => ({
        title: column.title,
        key: `job-${column.key}`,
        width: JOB_OUTPUT_COLUMN_WIDTH,
        align: 'right',
        render: (_value, record) =>
          renderJobOutputCell({
            jobName: column.key,
            onOpen: openJobDetail,
            record,
          }),
      }))

    const statusColumns: TableColumnsType<OrderStatusDashboardItem> = [
      {
        title: '物料转移数量',
        dataIndex: 'transferQuantity',
        key: 'transferQuantity',
        width: 120,
        align: 'right',
        render: (_value, record) =>
          renderTransferQuantityCell({
            onOpen: openTransferDetail,
            record,
          }),
      },
      {
        title: '入库数量',
        dataIndex: 'warehouseTransferQuantity',
        key: 'warehouseTransferQuantity',
        width: 110,
        align: 'right',
        render: renderQuantity,
      },
      {
        title: '转移记录',
        dataIndex: 'transferRecordCount',
        key: 'transferRecordCount',
        width: 90,
        align: 'right',
        render: renderQuantity,
      },
      {
        title: '接收车间',
        dataIndex: 'transferWorkshops',
        key: 'transferWorkshops',
        width: 180,
        render: renderTransferWorkshops,
      },
      {
        title: '最近转移',
        dataIndex: 'latestTransferAt',
        key: 'latestTransferAt',
        width: 190,
        render: renderLatestTransfer,
      },
      {
        title: '成品率',
        dataIndex: 'yieldRate',
        key: 'yieldRate',
        width: 90,
        align: 'right',
        render: renderPercent,
      },
      {
        title: '完工率（%）',
        dataIndex: 'completionRate',
        key: 'completionRate',
        width: 110,
        align: 'right',
        render: renderPercent,
      },
      {
        title: '生产状态',
        dataIndex: 'productionStatus',
        key: 'productionStatus',
        width: 180,
        fixed: 'right',
        align: 'center',
        render: (value: OrderProductionStatus, record) => (
          <Space size={4} wrap>
            <Tag color={STATUS_COLOR[value]}>{value}</Tag>
            {record.status && <Tag>{record.status}</Tag>}
          </Space>
        ),
      },
    ]

    return [...baseColumns, ...outputColumns, ...statusColumns]
  }, [jobColumns, openJobDetail, openTransferDetail, page, pageSize])

  const tableWidth =
    BASE_TABLE_WIDTH +
    jobColumns.length * JOB_OUTPUT_COLUMN_WIDTH +
    STATUS_TABLE_WIDTH

  useEffect(() => {
    setSearchValues(searchParamValues)
  }, [searchParamValues])

  function updateSearchParamValue(key: keyof SearchValues, value: string) {
    setSearchValues((current) => ({ ...current, [key]: value }))
  }

  function setOrDeleteParam(
    params: URLSearchParams,
    key: keyof SearchValues,
    value: string,
  ) {
    const normalizedValue = value.trim()

    if (normalizedValue) {
      params.set(key, normalizedValue)
    } else {
      params.delete(key)
    }
  }

  function handleSearch() {
    const next = new URLSearchParams(searchParams)

    setOrDeleteParam(next, 'orderDate', searchValues.orderDate)
    setOrDeleteParam(next, 'projectNo', searchValues.projectNo)
    setOrDeleteParam(next, 'model', searchValues.model)
    next.set('page', '1')
    setSearchParams(next)
    setSelectedJobDetail(null)
    setSelectedTransferDetail(null)
  }

  function handleResetSearch() {
    const next = new URLSearchParams(searchParams)

    next.delete('orderDate')
    next.delete('projectNo')
    next.delete('model')
    next.set('page', '1')
    setSearchValues(EMPTY_SEARCH_VALUES)
    setSearchParams(next)
    setSelectedJobDetail(null)
    setSelectedTransferDetail(null)
  }

  function handleStatusTabChange(nextStatus: string) {
    const normalizedStatus = normalizeStatusTab(nextStatus)
    const next = new URLSearchParams(searchParams)

    if (normalizedStatus === '生产中') {
      next.delete('status')
    } else {
      next.set('status', normalizedStatus)
    }

    next.set('page', '1')
    setSearchParams(next)
    setSelectedJobDetail(null)
    setSelectedTransferDetail(null)
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="min-w-0">
          <Title level={4} className="mb-0!">
            订单现状
          </Title>
        </div>
        <Space size={8} wrap>
          <Tag color="blue">订单 {data?.total ?? 0}</Tag>
          <Tag color="cyan">岗位 {jobColumns.length}</Tag>
          <Tag color="green">明细 {data?.productionItemCount ?? 0}</Tag>
          <Tag color="purple">转移 {data?.materialTransferCount ?? 0}</Tag>
          <Button
            size="small"
            icon={<ArrowPathIcon className="size-4" />}
            loading={isFetching && !isLoading}
            onClick={() => void refetch()}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeStatus}
        items={STATUS_TABS}
        onChange={handleStatusTabChange}
        tabBarStyle={{ marginBottom: 0 }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Text type="secondary">搜索：</Text>
        <Input
          allowClear
          placeholder="订单日期"
          value={searchValues.orderDate}
          onChange={(event) =>
            updateSearchParamValue('orderDate', event.target.value)
          }
          onPressEnter={handleSearch}
          style={{ width: 180 }}
        />
        <Input
          allowClear
          placeholder="项目号"
          value={searchValues.projectNo}
          onChange={(event) =>
            updateSearchParamValue('projectNo', event.target.value)
          }
          onPressEnter={handleSearch}
          style={{ width: 180 }}
        />
        <Input
          allowClear
          placeholder="型号"
          value={searchValues.model}
          onChange={(event) =>
            updateSearchParamValue('model', event.target.value)
          }
          onPressEnter={handleSearch}
          style={{ width: 180 }}
        />
        <Button
          type="primary"
          icon={<MagnifyingGlassIcon className="size-4" />}
          loading={isFetching && !isLoading}
          onClick={handleSearch}
        >
          搜索
        </Button>
        <Button
          icon={<XMarkIcon className="size-4" />}
          onClick={handleResetSearch}
        >
          重置
        </Button>
      </div>

      <div
        ref={tableContainerRef}
        className="min-h-0 flex-1 overflow-auto pb-3"
      >
        <Table<OrderStatusDashboardItem>
          rowKey="id"
          bordered
          size="small"
          loading={{ spinning: isDataLoading, tip: '数据加载中...' }}
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{
            x: tableWidth,
            y: scrollY,
            scrollToFirstRowOnChange: true,
          }}
          sticky={{ offsetScroll: 8 }}
          rowClassName={(record) =>
            record.productionStatus === '延期'
              ? 'bg-red-50'
              : record.productionStatus === '预警'
                ? 'bg-amber-50'
                : ''
          }
          onRow={() => ({ style: { height: rowHeight } })}
        />
      </div>

      <div ref={paginationRef}>
        <AppPagination
          total={data?.total ?? 0}
          defaultPageSize={DEFAULT_PAGE_SIZE}
          pageSizeOptions={['10', '20', '50']}
        />
      </div>

      <ProductionDetailModal
        detail={selectedJobDetail}
        onClose={() => setSelectedJobDetail(null)}
      />
      <TransferDetailModal
        detail={selectedTransferDetail}
        onClose={() => setSelectedTransferDetail(null)}
      />
    </div>
  )
}
