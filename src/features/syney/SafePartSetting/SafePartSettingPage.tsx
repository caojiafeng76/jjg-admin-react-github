import { useCallback, useState, useMemo, type Key } from 'react'
import {
  Button,
  Form,
  Input,
  Modal,
  Switch,
  Table,
  App,
  Select,
  Tooltip,
  Upload,
  Pagination,
} from 'antd'
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface'
import { SearchOutlined } from '@ant-design/icons'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteSyneySafePartSettings,
  getSyneySafePartDrawingDownloadUrl,
  getSyneySafePartDrawingPreviewUrl,
  getSyneySafePartSettings,
  SAFE_PART_DRAWING_ACCEPT,
  upsertSyneySafePartSetting,
  SyneySafePartSetting,
  uploadSyneySafePartDrawing,
} from '@services/apiSyneySafePartSettings'

const DECOMPOSITION_ROLE_LABELS: Record<string, string> = {
  side_frame: '侧围',
  cross_frame: '横围',
  front_plate: '前板',
  upper_middle: '上中板',
  lower_middle: '下中板',
  rear_upper: '上后板',
  rear_lower: '下后板',
  extension_upper: '上加长板',
  extension_lower: '下加长板',
}

const DECOMPOSITION_ROLE_OPTIONS = Object.entries(
  DECOMPOSITION_ROLE_LABELS,
).map(([value, label]) => ({ value, label }))

type SafePartSettingFormValues = Parameters<
  typeof upsertSyneySafePartSetting
>[0]

type DrawingPreview = {
  url: string
  fileName: string
  mimeType: string | null
}

export default function SafePartSettingPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SyneySafePartSetting | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [previewDrawing, setPreviewDrawing] = useState<DrawingPreview | null>(
    null,
  )
  const [uploadingDrawingId, setUploadingDrawingId] = useState<string | null>(
    null,
  )
  const [previewingDrawingId, setPreviewingDrawingId] = useState<string | null>(
    null,
  )
  const [downloadingDrawingId, setDownloadingDrawingId] = useState<
    string | null
  >(null)
  const [partNoFilter, setPartNoFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [form] = Form.useForm()

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ need_print_label: true, is_safe_part: true })
    setModalOpen(true)
  }

  const openEdit = useCallback((record: SyneySafePartSetting) => {
    setEditing(record)
    form.setFieldsValue({
      part_no: record.part_no,
      name: record.name ?? undefined,
      part_model: record.part_model ?? '',
      part_code_prefix: record.part_code_prefix ?? '',
      english_name: record.english_name ?? '',
      need_print_label: record.need_print_label,
      is_safe_part: record.is_safe_part,
      decomposition_role: record.decomposition_role ?? undefined,
      remark: record.remark ?? '',
      id: record.id,
    })
    setModalOpen(true)
  }, [form])

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    form.resetFields()
  }

  const { data, isLoading } = useQuery({
    queryKey: ['syney_safe_part_settings'],
    queryFn: getSyneySafePartSettings,
  })

  const saveMutation = useMutation({
    mutationFn: upsertSyneySafePartSetting,
    onSuccess: () => {
      message.success('保存成功')
      queryClient.invalidateQueries({ queryKey: ['syney_safe_part_settings'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSyneySafePartSettings,
    onSuccess: () => {
      message.success('删除成功')
      setSelectedRowKeys([])
      queryClient.invalidateQueries({ queryKey: ['syney_safe_part_settings'] })
    },
  })

  const drawingUploadMutation = useMutation({
    mutationFn: uploadSyneySafePartDrawing,
  })

  const handleDrawingUpload = useCallback(
    async (record: SyneySafePartSetting, file: File) => {
      setUploadingDrawingId(record.id)

      try {
        await drawingUploadMutation.mutateAsync({ setting: record, file })
        message.success('图纸上传成功')
        queryClient.invalidateQueries({
          queryKey: ['syney_safe_part_settings'],
        })
      } catch (error) {
        message.error(error instanceof Error ? error.message : '图纸上传失败')
      } finally {
        setUploadingDrawingId(null)
      }
    },
    [drawingUploadMutation, message, queryClient],
  )

  const handlePreviewDrawing = useCallback(
    async (record: SyneySafePartSetting) => {
      if (!record.drawing_file_path) {
        message.warning('暂无图纸')
        return
      }

      setPreviewingDrawingId(record.id)

      try {
        const url = await getSyneySafePartDrawingPreviewUrl(
          record.drawing_file_path,
        )
        setPreviewDrawing({
          url,
          fileName: record.drawing_file_name ?? '图纸预览',
          mimeType: record.drawing_file_mime_type,
        })
      } catch (error) {
        message.error(error instanceof Error ? error.message : '图纸预览失败')
      } finally {
        setPreviewingDrawingId(null)
      }
    },
    [message],
  )

  const handleDownloadDrawing = useCallback(
    async (record: SyneySafePartSetting) => {
      if (!record.drawing_file_path) {
        message.warning('暂无图纸')
        return
      }

      setDownloadingDrawingId(record.id)

      try {
        const fileName = record.drawing_file_name ?? `${record.part_no}-图纸`
        const url = await getSyneySafePartDrawingDownloadUrl({
          filePath: record.drawing_file_path,
          fileName,
        })
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (error) {
        message.error(error instanceof Error ? error.message : '图纸下载失败')
      } finally {
        setDownloadingDrawingId(null)
      }
    },
    [message],
  )

  const handleBatchDelete = () => {
    const selectedIds = selectedRowKeys.map(String)

    if (selectedIds.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    deleteMutation.mutate(selectedIds)
  }

  const filteredData = useMemo(() => {
    if (!data) return []
    if (!partNoFilter.trim()) return data
    const lower = partNoFilter.toLowerCase()
    return data.filter((item) =>
      (item.part_no ?? '').toLowerCase().includes(lower),
    )
  }, [data, partNoFilter])

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  const columns: ColumnsType<SyneySafePartSetting> = useMemo(
    () => [
      {
        title: '#',
        key: 'index',
        width: 60,
        fixed: 'left',
        render: (_: unknown, __: SyneySafePartSetting, index: number) =>
          (page - 1) * pageSize + index + 1,
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
          <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
            <Input
              placeholder="搜索件号"
              value={selectedKeys[0] as string}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
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
        render: (v: boolean) =>
          v ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              是
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              否
            </div>
          ),
      },
      {
        title: '安全部件',
        dataIndex: 'is_safe_part',
        key: 'is_safe_part',
        width: 100,
        render: (v: boolean) =>
          v ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600 shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              是
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              否
            </div>
          ),
      },
      {
        title: '分解单列',
        dataIndex: 'decomposition_role',
        key: 'decomposition_role',
        width: 110,
        render: (v: string | null) => {
          const label = DECOMPOSITION_ROLE_LABELS[v ?? ''] ?? v
          return label ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {label}
            </span>
          ) : (
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
            onClick={() => openEdit(record)}
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
      openEdit,
      page,
      pageSize,
      previewingDrawingId,
      uploadingDrawingId,
    ],
  )

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: Key[]) => setSelectedRowKeys(keys),
    preserveSelectedRowKeys: true,
  }

  const handleSubmit = (values: SafePartSettingFormValues) => {
    saveMutation.mutate(values)
  }

  const selectedCount = selectedRowKeys.length
  const total = filteredData.length

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="text"
          icon={<PlusCircleIcon className="size-4 text-emerald-500/80!" />}
          onClick={openCreate}
        >
          新增
        </Button>
        <Tooltip
          title={
            selectedCount > 0
              ? `已选择 ${selectedCount} 条数据`
              : '请选择要删除的数据'
          }
        >
          <span>
            <Button
              type="text"
              loading={deleteMutation.isPending}
              disabled={selectedCount === 0}
              onClick={handleBatchDelete}
              icon={<XCircleIcon className="size-4 text-rose-500/80!" />}
            >
              删除{selectedCount > 0 ? `(${selectedCount})` : ''}
            </Button>
          </span>
        </Tooltip>
      </div>

      {/* 选中摘要条 */}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-blue-50/80 px-5 py-3 shadow-[0_8px_30px_rgba(59,130,246,0.12)] backdrop-blur-sm">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-3.5 w-3.5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            已选
            <span className="mx-1 text-lg font-bold text-blue-600">
              {selectedCount}
            </span>
            条
          </span>
        </div>
      ) : null}

      {/* 搜索栏 */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600">筛选条件</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">件号：</span>
            <Input
              placeholder="搜索件号（前端过滤）"
              value={partNoFilter}
              onChange={(e) => {
                setPartNoFilter(e.target.value)
                setPage(1)
              }}
              allowClear={{
                clearIcon: (
                  <XMarkIcon className="h-3.5 w-3.5 text-slate-400" />
                ),
              }}
              prefix={
                <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400" />
              }
              className="w-64 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div className="min-h-0 overflow-hidden">
          <Table
            rowKey="id"
            loading={
              isLoading ||
              saveMutation.isPending ||
              deleteMutation.isPending
            }
            dataSource={pagedData}
            columns={columns}
            rowSelection={rowSelection}
            size="small"
            pagination={false}
            scroll={{ x: 'max-content', y: 'calc(100vh - 420px)' }}
            style={{ fontSize: '13px' }}
            className="[&_.ant-table-thead>tr>th]:bg-slate-50 [&_.ant-table-thead>tr>th]:font-medium [&_.ant-table-thead>tr>th]:text-slate-600 [&_.ant-table-thead>tr>th]:border-slate-200 [&_.ant-table-row:hover>td]:bg-blue-50/50"
          />
        </div>
        <div className="flex shrink-0 justify-end">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            showSizeChanger={{
              getPopupContainer: () => document.body,
            }}
            pageSizeOptions={['10', '20', '50', '100']}
            showTotal={(t) => `共 ${t} 条`}
            onChange={(p) => setPage(p)}
            onShowSizeChange={(_current, size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </div>
      </div>

      <Modal
        title={editing ? '编辑件号配置' : '新增件号配置'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editing ? '保存修改' : '新增'}
        cancelText="取消"
        confirmLoading={saveMutation.isPending}
        width={640}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          className="pt-2"
        >
          <Form.Item
            label="件号(包含)"
            name="part_no"
            rules={[{ required: true, message: '请输入件号' }]}
          >
            <Input allowClear placeholder="如 XN2808EB" className="rounded-lg" />
          </Form.Item>
          <Form.Item label="名称" name="name">
            <Select
              allowClear
              getPopupContainer={() => document.body}
              className="rounded-lg"
              options={[
                { label: '梳齿支撑板', value: '梳齿支撑板' },
                { label: '楼层板', value: '楼层板' },
                { label: '横框', value: '横框' },
                { label: '侧框', value: '侧框' },
              ]}
            />
          </Form.Item>
          <Form.Item label="产品型号" name="part_model">
            <Input
              allowClear
              placeholder="如 YD1001XN"
              className="rounded-lg"
            />
          </Form.Item>
          <Form.Item label="编号前缀" name="part_code_prefix">
            <Input allowClear placeholder="如 ZC00" className="rounded-lg" />
          </Form.Item>
          <Form.Item label="英文名称" name="english_name">
            <Input
              allowClear
              placeholder="如 COMB PLATE"
              className="rounded-lg"
            />
          </Form.Item>
          <div className="flex gap-8">
            <Form.Item
              label="需打印标签"
              name="need_print_label"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="为安全部件"
              name="is_safe_part"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </div>
          <Form.Item label="分解单列" name="decomposition_role">
            <Select
              allowClear
              placeholder="非分解单件号可不选"
              getPopupContainer={() => document.body}
              className="rounded-lg"
              options={DECOMPOSITION_ROLE_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input allowClear className="rounded-lg" />
          </Form.Item>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={previewDrawing?.fileName ?? '图纸预览'}
        open={Boolean(previewDrawing)}
        footer={null}
        width="80vw"
        destroyOnHidden
        onCancel={() => setPreviewDrawing(null)}
      >
        {previewDrawing?.mimeType?.startsWith('image/') ? (
          <div className="flex max-h-[70vh] justify-center overflow-auto rounded border border-slate-200 bg-slate-50 p-3">
            <img
              src={previewDrawing.url}
              alt={previewDrawing.fileName}
              className="max-h-[66vh] max-w-full object-contain"
            />
          </div>
        ) : (
          <iframe
            title={previewDrawing?.fileName ?? '图纸预览'}
            src={previewDrawing?.url}
            className="h-[70vh] w-full rounded border border-slate-200"
          />
        )}
      </Modal>
    </div>
  )
}
