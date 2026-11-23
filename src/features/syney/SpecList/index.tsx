import type { FormInstance } from 'antd'
import type { Key } from 'react'
import type { ISyneySpec } from '@/types'

import AddButton from '@ui/AddButton'
import DeleteButton from '@ui/DeleteButton'
import EditButton from '@ui/EditButton'
import { App, Modal } from 'antd'
import { useMemo, useState } from 'react'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useUrlListState } from '@/hooks/useUrlListState'
import AppPagination from '@/ui/AppPagination'
import FilterBar from '@/ui/FilterBar'
import FormErrorAlert from '@/ui/FormErrorAlert'
import SelectedSummaryBar from '@/ui/SelectedSummaryBar'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import SpecForm from './SpecForm'
import SpecSearch from './SpecSearch'
import SpecTable from './SpecTable'
import { useCreateSyneySpec } from './useCreateSpec'
import { useDeleteSyneySpecs } from './useDeleteSyneySpecs'
import { useSyneySpecsList } from './useSyneySpecs'
import { useUpdateSyneySpec } from './useUpdateSyneySpec'

export default function SpecList() {
  const { message } = App.useApp()
  const { page, pageSize, filters, setFilters, resetFilters }
    = useUrlListState(['PartNo'] as const)

  const [formRef, setFormRef] = useState<FormInstance<ISyneySpec> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建踏板规格')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const { syneySpecs, isLoading, isFetching, error, count, refetch }
    = useSyneySpecsList({
      partNo: filters.PartNo,
      page,
      pageSize,
      silentError: true,
    })
  const { isCreating, createSyneySpec } = useCreateSyneySpec()
  const { isUpdating, updateSyneySpec } = useUpdateSyneySpec()
  const { isDeleting, deleteSyneySpecs } = useDeleteSyneySpecs()

  const specIds = selectedRowKeys.map(id => Number(id))
  const spec = syneySpecs?.find(item => item.id === specIds?.at(0))

  // Modal 使用 destroyOnHidden，每次打开都会重新挂载 SpecForm，表单初值由 initialValues 提供
  function showModal() {
    setFormError(null)
    setIsModalOpen(true)
  }

  function onSelect(keys: Key[]) {
    setSelectedRowKeys(keys)
  }

  async function handleFinish(specData: ISyneySpec) {
    setFormError(null)
    try {
      if (isEditing) {
        await updateSyneySpec({ ...specData, id: spec?.id })
        message.success(feedbackText.updated('踏板规格'))
      }
      else {
        await createSyneySpec(specData)
        message.success(feedbackText.created('踏板规格'))
      }
      setSelectedRowKeys([])
      handleCancel()
    }
    catch (err) {
      setFormError(err)
    }
  }

  function handleCancel() {
    setIsEditing(false)
    setFormError(null)
    setIsModalOpen(false)
  }

  function handleOk() {
    formRef?.submit()
  }

  function handleCreate() {
    setModalTitle('新建踏板规格')
    setIsEditing(false)
    showModal()
  }

  function handleEdit() {
    if (specIds?.length !== 1) {
      message.warning('请选择一条踏板规格进行编辑')
      return
    }
    setModalTitle('编辑踏板规格')
    setIsEditing(true)
    showModal()
  }

  async function handleDelete() {
    if (specIds?.length === 0) {
      message.warning(feedbackText.selectRequired('删除'))
      return
    }
    try {
      await deleteSyneySpecs(specIds)
      message.success(feedbackText.deleted('踏板规格', specIds.length))
      setSelectedRowKeys([])
    }
    catch (err) {
      message.error(getUserErrorMessage(err, feedbackText.failed('删除', '踏板规格')))
    }
  }

  const records = useMemo(() => syneySpecs || [], [syneySpecs])
  const selectedCount = selectedRowKeys.length
  const hasData = records.length > 0

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 0,
  })

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="只能选择一条数据" handleEdit={handleEdit} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          count={selectedCount}
          title="删除踏板规格"
          itemName="踏板规格"
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

      {/* 搜索 / 过滤栏 */}
      <FilterBar>
        <SpecSearch
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
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <TableState
            loading={Boolean(isLoading) && !hasData}
            error={error}
            onRetry={refetch}
          >
            <SpecTable
              data={records}
              loading={Boolean(isFetching) || isDeleting}
              onSelect={onSelect}
              selectedRowKeys={selectedRowKeys}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={count || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={isCreating || isUpdating}
        width={520}
        destroyOnHidden
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <div className="space-y-4">
          <FormErrorAlert
            error={formError}
            reason={
              formError
                ? getUserErrorMessage(
                    formError,
                    feedbackText.failed(isEditing ? '更新' : '创建', '踏板规格'),
                  )
                : undefined
            }
          />
          <SpecForm
            onFinish={handleFinish}
            setFormRef={setFormRef}
            isSubmitting={isCreating || isUpdating}
            isEditing={isEditing}
            initialValues={isEditing ? spec : undefined}
          />
        </div>
      </Modal>
    </div>
  )
}
