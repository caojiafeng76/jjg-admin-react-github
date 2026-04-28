import { useState, type Key } from 'react'
import {
  Button,
  Form,
  Input,
  Modal,
  Switch,
  Table,
  Popconfirm,
  Space,
  App,
  Select,
  Tooltip,
  Upload,
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
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [form] = Form.useForm()

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ need_print_label: true, is_safe_part: true })
    setModalOpen(true)
  }

  const openEdit = (record: SyneySafePartSetting) => {
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
  }

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

  const handleDrawingUpload = async (
    record: SyneySafePartSetting,
    file: File,
  ) => {
    setUploadingDrawingId(record.id)

    try {
      await drawingUploadMutation.mutateAsync({ setting: record, file })
      message.success('图纸上传成功')
      queryClient.invalidateQueries({ queryKey: ['syney_safe_part_settings'] })
    } catch (error) {
      message.error(error instanceof Error ? error.message : '图纸上传失败')
    } finally {
      setUploadingDrawingId(null)
    }
  }

  const handlePreviewDrawing = async (record: SyneySafePartSetting) => {
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
  }

  const handleDownloadDrawing = async (record: SyneySafePartSetting) => {
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
  }

  const handleBatchDelete = () => {
    const selectedIds = selectedRowKeys.map(String)

    if (selectedIds.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    deleteMutation.mutate(selectedIds)
  }

  const columns: ColumnsType<SyneySafePartSetting> = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 60,
      render: (_: unknown, __: SyneySafePartSetting, index: number) =>
        (page - 1) * pageSize + index + 1,
    },
    {
      title: '件号(包含)',
      dataIndex: 'part_no',
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
          <Space>
            <Button type="primary" size="small" onClick={() => confirm()}>
              确定
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.()
                confirm({ closeDropdown: false })
              }}
            >
              重置
            </Button>
          </Space>
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
    { title: '名称', dataIndex: 'name' },
    { title: '产品型号', dataIndex: 'part_model' },
    { title: '编号前缀', dataIndex: 'part_code_prefix' },
    { title: '英文名称', dataIndex: 'english_name' },
    {
      title: '是否需打印标签',
      dataIndex: 'need_print_label',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '是否为安全部件',
      dataIndex: 'is_safe_part',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '分解单列',
      dataIndex: 'decomposition_role',
      render: (v: string | null) =>
        DECOMPOSITION_ROLE_LABELS[v ?? ''] ?? v ?? '-',
    },
    {
      title: '图纸',
      dataIndex: 'drawing_file_name',
      width: 220,
      render: (_: unknown, record: SyneySafePartSetting) => {
        const hasDrawing = Boolean(record.drawing_file_path)
        const uploadLoading = uploadingDrawingId === record.id
        const previewLoading = previewingDrawingId === record.id
        const downloadLoading = downloadingDrawingId === record.id

        return (
          <Space size={4}>
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
                icon={<ArrowUpTrayIcon className="size-4 text-green-500/80!" />}
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
              icon={<ArrowDownTrayIcon className="size-4 text-slate-500/80!" />}
              onClick={() => handleDownloadDrawing(record)}
            >
              下载
            </Button>
          </Space>
        )
      },
    },
    { title: '备注', dataIndex: 'remark' },
    {
      title: '操作',
      render: (_: unknown, record: SyneySafePartSetting) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<PencilSquareIcon className="size-4 text-yellow-500/80!" />}
            onClick={() => openEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: Key[]) => setSelectedRowKeys(keys),
  }

  const handleSubmit = (values: SafePartSettingFormValues) => {
    saveMutation.mutate(values)
  }

  return (
    <div className="grid grid-rows-[32px_1fr] gap-4">
      <div className="flex h-full items-center gap-2">
        <Button
          type="text"
          icon={<PlusCircleIcon className="size-4 text-green-500/80!" />}
          onClick={openCreate}
        >
          新增
        </Button>
        <Tooltip
          title={
            selectedRowKeys.length > 0
              ? `已选择 ${selectedRowKeys.length} 条数据`
              : '请选择要删除的数据'
          }
        >
          <span>
            <Popconfirm
              title="确认批量删除?"
              description={`确定删除选中的 ${selectedRowKeys.length} 条件号配置吗？`}
              disabled={selectedRowKeys.length === 0}
              onConfirm={handleBatchDelete}
              okText="确认删除"
              cancelText="取消"
              okButtonProps={{
                loading: deleteMutation.isPending,
                danger: true,
              }}
            >
              <Button
                type="text"
                loading={deleteMutation.isPending}
                disabled={selectedRowKeys.length === 0}
                icon={<XCircleIcon className="size-4 text-red-500/80!" />}
              >
                删除
                {selectedRowKeys.length > 0
                  ? `(${selectedRowKeys.length})`
                  : ''}
              </Button>
            </Popconfirm>
          </span>
        </Tooltip>
      </div>

      <Modal
        title={editing ? '编辑件号配置' : '新增件号配置'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={editing ? '保存修改' : '新增'}
        cancelText="取消"
        confirmLoading={saveMutation.isPending}
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
            <Input allowClear placeholder="如 XN2808EB" />
          </Form.Item>
          <Form.Item label="名称" name="name">
            <Select
              allowClear
              options={[
                { label: '梳齿支撑板', value: '梳齿支撑板' },
                { label: '楼层板', value: '楼层板' },
                { label: '横框', value: '横框' },
                { label: '侧框', value: '侧框' },
              ]}
            />
          </Form.Item>
          <Form.Item label="产品型号" name="part_model">
            <Input allowClear placeholder="如 YD1001XN" />
          </Form.Item>
          <Form.Item label="编号前缀" name="part_code_prefix">
            <Input allowClear placeholder="如 ZC00" />
          </Form.Item>
          <Form.Item label="英文名称" name="english_name">
            <Input allowClear placeholder="如 COMB PLATE" />
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
              options={DECOMPOSITION_ROLE_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input allowClear />
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

      <div className="no-scrollbar overflow-y-scroll">
        <Table
          rowKey="id"
          loading={
            isLoading || saveMutation.isPending || deleteMutation.isPending
          }
          dataSource={data ?? []}
          columns={columns}
          rowSelection={rowSelection}
          size="small"
          pagination={{
            current: page,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p) => setPage(p),
            onShowSizeChange: (_current, size) => {
              setPageSize(size)
              setPage(1)
            },
          }}
          scroll={{
            x: 'max-content',
            y: 550,
          }}
        />
      </div>
    </div>
  )
}
