import type { SyneySafePartSetting } from '@services/apiSyneySafePartSettings'
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface'
import type { Key } from 'react'
import type { useSafePartDrawing } from './useSafePartDrawing'
import { SearchOutlined } from '@ant-design/icons'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  PencilSquareIcon,
} from '@heroicons/react/16/solid'
import { SAFE_PART_DRAWING_ACCEPT } from '@services/apiSyneySafePartSettings'
import { Button, Input, Table, Tooltip, Upload } from 'antd'
import { useMemo } from 'react'
import { DECOMPOSITION_ROLE_LABELS } from './constants'

type SafePartDrawingActions = Omit<
  ReturnType<typeof useSafePartDrawing>,
  'previewDrawing' | 'closePreview'
>

export interface SafePartSettingTableProps {
  data: SyneySafePartSetting[]
  loading: boolean
  page: number
  pageSize: number
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onEdit: (record: SyneySafePartSetting) => void
  drawing: SafePartDrawingActions
}

function BooleanBadge({ value }: { value: boolean }) {
  return value
    ? (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-400">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          是
        </div>
      )
    : (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm dark:bg-slate-700/50 dark:text-slate-400">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
          否
        </div>
      )
}

export default function SafePartSettingTable({
  data,
  loading,
  page,
  pageSize,
  selectedRowKeys,
  onSelectionChange,
  onEdit,
  drawing,
}: SafePartSettingTableProps) {
  const {
    downloadingDrawingId,
    handleDownloadDrawing,
    handleDrawingUpload,
    handlePreviewDrawing,
    previewingDrawingId,
    uploadingDrawingId,
  } = drawing

  const columns: ColumnsType<SyneySafePartSetting> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 60,
        fixed: 'left',
        align: 'right',
        render: (_: unknown, __: SyneySafePartSetting, index: number) => (
          <span className="tabular-nums">
            {(page - 1) * pageSize + index + 1}
          </span>
        ),
      },
      {
        title: '件号(包含)',
        dataIndex: 'part_no',
        key: 'part_no',
        width: 200,
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }: FilterDropdownProps) => (
          <div style={{ padding: 8 }} onKeyDown={e => e.stopPropagation()}>
            <Input
              placeholder="搜索件号"
              value={selectedKeys[0] as string}
              onChange={e =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => confirm()}
              style={{ marginBottom: 8, display: 'block' }}
            />
            <div className="flex gap-2">
              <Button
                type="primary"
                size="small"
                onClick={() => confirm()}
                className="rounded-lg"
              >
                确定
              </Button>
              <Button
                size="small"
                onClick={() => {
                  clearFilters?.()
                  confirm({ closeDropdown: false })
                }}
                className="rounded-lg"
              >
                重置
              </Button>
            </div>
          </div>
        ),
        filterIcon: (filtered: boolean) => (
          <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
        ),
        onFilter: (value, record) =>
          (record.part_no ?? '')
            .toLowerCase()
            .includes(String(value).toLowerCase()),
      },
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: 130,
        render: (value: string | null) => value || '-',
      },
      {
        title: '产品型号',
        dataIndex: 'part_model',
        key: 'part_model',
        width: 130,
        render: (value: string | null) => value || '-',
      },
      {
        title: '编号前缀',
        dataIndex: 'part_code_prefix',
        key: 'part_code_prefix',
        width: 120,
        render: (value: string | null) => value || '-',
      },
      {
        title: '英文名称',
        dataIndex: 'english_name',
        key: 'english_name',
        width: 160,
        render: (value: string | null) => value || '-',
      },
      {
        title: '需打印标签',
        dataIndex: 'need_print_label',
        key: 'need_print_label',
        width: 100,
        render: (v: boolean) => <BooleanBadge value={v} />,
      },
      {
        title: '安全部件',
        dataIndex: 'is_safe_part',
        key: 'is_safe_part',
        width: 100,
        render: (v: boolean) => <BooleanBadge value={v} />,
      },
      {
        title: '分解单列',
        dataIndex: 'decomposition_role',
        key: 'decomposition_role',
        width: 110,
        render: (v: string | null) => {
          const label = DECOMPOSITION_ROLE_LABELS[v ?? ''] ?? v
          return label
            ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
                  {label}
                </span>
              )
            : (
                '-'
              )
        },
      },
      {
        title: '图纸',
        dataIndex: 'drawing_file_name',
        key: 'drawing_file_name',
        width: 240,
        render: (_: unknown, record: SyneySafePartSetting) => {
          const hasDrawing = Boolean(record.drawing_file_path)
          const uploadLoading = uploadingDrawingId === record.id
          const previewLoading = previewingDrawingId === record.id
          const downloadLoading = downloadingDrawingId === record.id

          return (
            <div className="flex flex-wrap items-center gap-1">
              <Upload
                accept={SAFE_PART_DRAWING_ACCEPT}
                beforeUpload={(file) => {
                  void handleDrawingUpload(record, file)
                  return Upload.LIST_IGNORE
                }}
                disabled={uploadLoading}
                maxCount={1}
                showUploadList={false}
              >
                <Button
                  type="text"
                  size="small"
                  loading={uploadLoading}
                  disabled={uploadLoading}
                  icon={
                    <ArrowUpTrayIcon className="size-4 text-emerald-500/80!" />
                  }
                >
                  {hasDrawing ? '替换' : '上传'}
                </Button>
              </Upload>
              <Tooltip title={record.drawing_file_name ?? '暂无图纸'}>
                <Button
                  type="text"
                  size="small"
                  disabled={!hasDrawing}
                  loading={previewLoading}
                  icon={<EyeIcon className="size-4 text-blue-500/80!" />}
                  onClick={() => handlePreviewDrawing(record)}
                >
                  查看
                </Button>
              </Tooltip>
              <Button
                type="text"
                size="small"
                disabled={!hasDrawing}
                loading={downloadLoading}
                icon={
                  <ArrowDownTrayIcon className="size-4 text-slate-500/80!" />
                }
                onClick={() => handleDownloadDrawing(record)}
              >
                下载
              </Button>
            </div>
          )
        },
      },
      {
        title: '备注',
        dataIndex: 'remark',
        key: 'remark',
        width: 160,
        ellipsis: true,
        render: (value: string | null) => value || '-',
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        fixed: 'right',
        render: (_: unknown, record: SyneySafePartSetting) => (
          <Button
            type="text"
            size="small"
            icon={
              <PencilSquareIcon className="size-4 text-amber-500/80!" />
            }
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
        ),
      },
    ],
    [
      downloadingDrawingId,
      handleDownloadDrawing,
      handleDrawingUpload,
      handlePreviewDrawing,
      onEdit,
      page,
      pageSize,
      previewingDrawingId,
      uploadingDrawingId,
    ],
  )

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: Key[]) => onSelectionChange(keys),
    preserveSelectedRowKeys: true,
  }

  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={data}
      columns={columns}
      rowSelection={rowSelection}
      size="small"
      pagination={false}
      scroll={{ x: 'max-content', y: 'calc(100vh - 420px)' }}
      style={{ fontSize: '13px' }}
      className="[&_.ant-table-row:hover>td]:bg-blue-50/50 dark:[&_.ant-table-row:hover>td]:bg-blue-900/30 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600 dark:[&_.ant-table-thead>tr>th]:border-slate-700 dark:[&_.ant-table-thead>tr>th]:bg-slate-800 dark:[&_.ant-table-thead>tr>th]:text-slate-300"
    />
  )
}
