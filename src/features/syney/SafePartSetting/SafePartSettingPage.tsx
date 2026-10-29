import type {
  SyneySafePartSetting,
} from '@services/apiSyneySafePartSettings'
import type { Key } from 'react'
import type { SafePartSettingFormValues } from './SafePartSettingFormModal'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid'
import {
  deleteSyneySafePartSettings,
  upsertSyneySafePartSetting,
} from '@services/apiSyneySafePartSettings'
import { App, Form, Input, Pagination } from 'antd'
import { useCallback, useMemo, useState } from 'react'
import { useMutationWithMessage } from '@/hooks/useMutationWithMessage'
import AddButton from '@/ui/AddButton'
import DeleteButton from '@/ui/DeleteButton'
import SelectedSummaryBar from '@/ui/SelectedSummaryBar'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import {
  SYNEY_SAFE_PART_SETTINGS_KEY,
  useSyneySafePartSettings,
} from '../useSyneySafePartSettings'
import SafePartDrawingPreviewModal from './SafePartDrawingPreviewModal'
import SafePartSettingFormModal from './SafePartSettingFormModal'
import SafePartSettingTable from './SafePartSettingTable'
import { useSafePartDrawing } from './useSafePartDrawing'

export default function SafePartSettingPage() {
  const { message } = App.useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SyneySafePartSetting | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [partNoFilter, setPartNoFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [form] = Form.useForm<SafePartSettingFormValues>()
  const { previewDrawing, closePreview, ...drawing } = useSafePartDrawing()

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
      part_model: record.part_model ?? undefined,
      part_code_prefix: record.part_code_prefix ?? undefined,
      english_name: record.english_name ?? undefined,
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

  const { data, isLoading, error, refetch } = useSyneySafePartSettings()

  const saveMutation = useMutationWithMessage({
    mutationFn: upsertSyneySafePartSetting,
    invalidateQueries: [[SYNEY_SAFE_PART_SETTINGS_KEY]],
    successMessage: feedbackText.saved('件号配置'),
    errorMessage: error =>
      getUserErrorMessage(error, feedbackText.failed('保存', '件号配置')),
    messageApi: message,
    onSuccess: () => closeModal(),
  })

  const deleteMutation = useMutationWithMessage({
    mutationFn: deleteSyneySafePartSettings,
    invalidateQueries: [[SYNEY_SAFE_PART_SETTINGS_KEY]],
    successMessage: (_data, ids) => feedbackText.deleted('件号配置', ids.length),
    errorMessage: error =>
      getUserErrorMessage(error, feedbackText.failed('删除', '件号配置')),
    messageApi: message,
    onSuccess: () => setSelectedRowKeys([]),
  })

  const handleBatchDelete = () => {
    const selectedIds = selectedRowKeys.map(String)

    if (selectedIds.length === 0) {
      message.warning(feedbackText.selectRequired('删除'))
      return
    }

    deleteMutation.mutate(selectedIds)
  }

  const filteredData = useMemo(() => {
    if (!data)
      return []
    if (!partNoFilter.trim())
      return data
    const lower = partNoFilter.toLowerCase()
    return data.filter(item =>
      (item.part_no ?? '').toLowerCase().includes(lower),
    )
  }, [data, partNoFilter])

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  const handleSubmit = (values: SafePartSettingFormValues) => {
    saveMutation.mutate(values)
  }

  const selectedCount = selectedRowKeys.length
  const total = filteredData.length

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={openCreate} />
        <DeleteButton
          onConfirm={handleBatchDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedCount}
          title="删除件号配置"
          itemName="件号配置"
        />
      </div>

      {/* 选中摘要条（S4 通用组件） */}
      {selectedCount > 0
        ? (
            <SelectedSummaryBar
              selectedCount={selectedCount}
              matchedCount={selectedCount}
              stats={[]}
            />
          )
        : null}

      {/* 搜索栏 */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">筛选条件</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">件号：</span>
            <Input
              placeholder="搜索件号（前端过滤）"
              value={partNoFilter}
              onChange={(e) => {
                setPartNoFilter(e.target.value)
                setPage(1)
              }}
              allowClear={{
                clearIcon: (
                  <XMarkIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                ),
              }}
              prefix={
                <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              }
              className="w-64 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div className="min-h-0 overflow-hidden">
          <TableState loading={isLoading && !data} error={error} onRetry={refetch}>
            <SafePartSettingTable
              data={pagedData}
              loading={
                isLoading
                || saveMutation.isPending
                || deleteMutation.isPending
              }
              page={page}
              pageSize={pageSize}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={setSelectedRowKeys}
              onEdit={openEdit}
              drawing={drawing}
            />
          </TableState>
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
            showTotal={t => `共 ${t} 条`}
            onChange={p => setPage(p)}
            onShowSizeChange={(_current, size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </div>
      </div>

      <SafePartSettingFormModal
        open={modalOpen}
        editing={editing}
        form={form}
        confirmLoading={saveMutation.isPending}
        onCancel={closeModal}
        onFinish={handleSubmit}
      />

      <SafePartDrawingPreviewModal
        previewDrawing={previewDrawing}
        onClose={closePreview}
      />
    </div>
  )
}
