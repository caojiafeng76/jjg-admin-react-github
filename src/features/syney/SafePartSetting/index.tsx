import type {
  SyneySafePartSetting,
} from '@services/apiSyneySafePartSettings'
import type { Key } from 'react'
import type { SafePartSettingFormValues } from './SafePartSettingFormModal'
import {
  deleteSyneySafePartSettings,
  upsertSyneySafePartSetting,
} from '@services/apiSyneySafePartSettings'
import { App } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutationWithInvalidation } from '@/hooks/useMutationWithInvalidation'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useUrlListState } from '@/hooks/useUrlListState'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import FilterBar from '@/ui/FilterBar'
import SelectedSummaryBar from '@/ui/SelectedSummaryBar'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { syneyKeys } from '../queryKeys'
import { useSyneySafePartSettings } from '../useSyneySafePartSettings'
import SafePartDrawingPreviewModal from './SafePartDrawingPreviewModal'
import SafePartSearch from './SafePartSearch'
import SafePartSettingFormModal from './SafePartSettingFormModal'
import SafePartSettingTable from './SafePartSettingTable'
import { useSafePartDrawing } from './useSafePartDrawing'

const ENTITY = '件号配置'
const DEFAULT_SAFE_PART_PAGE_SIZE = 20

export default function SafePartSettingPage() {
  const { message } = App.useApp()
  const { page, pageSize, filters, setFilters, resetFilters, setPage }
    = useUrlListState(['partNo'] as const, { defaultPageSize: DEFAULT_SAFE_PART_PAGE_SIZE })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SyneySafePartSetting | null>(null)
  const [formError, setFormError] = useState<unknown>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const { previewDrawing, closePreview, ...drawing } = useSafePartDrawing()

  const openCreate = () => {
    setEditing(null)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = useCallback((record: SyneySafePartSetting) => {
    setEditing(record)
    setFormError(null)
    setModalOpen(true)
  }, [])

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setFormError(null)
  }

  const { data, isLoading, isFetching, error, refetch } = useSyneySafePartSettings()

  const saveMutation = useMutationWithInvalidation({
    mutationFn: upsertSyneySafePartSetting,
    invalidateQueries: [syneyKeys.safePartSettings.all],
  })

  const deleteMutation = useMutationWithInvalidation({
    mutationFn: deleteSyneySafePartSettings,
    invalidateQueries: [syneyKeys.safePartSettings.all],
  })

  const handleBatchDelete = async () => {
    const selectedIds = selectedRowKeys.map(String)

    if (selectedIds.length === 0) {
      message.warning(feedbackText.selectRequired('删除'))
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedIds)
      message.success(feedbackText.deleted(ENTITY, selectedIds.length))
      setSelectedRowKeys([])
    }
    catch (deleteError) {
      message.error(getUserErrorMessage(deleteError, feedbackText.failed('删除', ENTITY)))
    }
  }

  const filteredData = useMemo(() => {
    if (!data)
      return []
    const keyword = filters.partNo?.trim()
    if (!keyword)
      return data
    const lower = keyword.toLowerCase()
    return data.filter(item =>
      (item.part_no ?? '').toLowerCase().includes(lower),
    )
  }, [data, filters.partNo])

  const total = filteredData.length

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / pageSize))
    if (data && page > maxPage) {
      setPage(maxPage)
    }
  }, [data, page, pageSize, setPage, total])

  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize])

  const handleSubmit = async (values: SafePartSettingFormValues) => {
    setFormError(null)
    try {
      await saveMutation.mutateAsync(values)
      message.success(feedbackText.saved(ENTITY))
      closeModal()
    }
    catch (submitError) {
      setFormError(submitError)
    }
  }

  const selectedCount = selectedRowKeys.length
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 0,
  })

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
          itemName={ENTITY}
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

      <FilterBar>
        <SafePartSearch
          values={filters}
          onSearch={(next) => {
            setSelectedRowKeys([])
            setFilters(next)
          }}
          onReset={() => {
            setSelectedRowKeys([])
            resetFilters()
          }}
          isLoading={Boolean(isFetching)}
        />
      </FilterBar>

      {/* 表格 + 分页 */}
      <div ref={tableContainerRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-hidden">
          <TableState loading={Boolean(isLoading) && !data} error={error} onRetry={refetch}>
            <SafePartSettingTable
              data={pagedData}
              loading={
                Boolean(isFetching)
                || saveMutation.isPending
                || deleteMutation.isPending
              }
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={setSelectedRowKeys}
              onEdit={openEdit}
              drawing={drawing}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={total} defaultPageSize={DEFAULT_SAFE_PART_PAGE_SIZE} />
        </div>
      </div>

      <SafePartSettingFormModal
        open={modalOpen}
        editing={editing}
        confirmLoading={saveMutation.isPending}
        error={formError}
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
