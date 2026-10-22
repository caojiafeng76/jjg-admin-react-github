import type { Key } from 'react'
import type { ISyneySpec, ISyneySpecFormRef } from '@/types'

import AddButton from '@ui/AddButton'
import DeleteButton from '@ui/DeleteButton'
import EditButton from '@ui/EditButton'
import { App, Modal } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTableHeight } from '@/hooks/useTableHeight'
import AppPagination from '@/ui/AppPagination'
import SelectedSummaryBar from '@/ui/SelectedSummaryBar'
import { TableState } from '@/ui/TableState'
import { feedbackText } from '@/utils/feedbackText'
import PartNoInput from './PartNoInput'
import SpecForm from './SpecForm'
import SpecTable from './SpecTable'
import { useCreateSyneySpec } from './useCreateSpec'
import { useDeleteSyneySpecs } from './useDeleteSyneySpecs'
import { useSyneySpecs } from './useSyneySpecs'
import { useUpdateSyneySpec } from './useUpdateSyneySpec'

export default function SpecList() {
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  const specFormRef = useRef<ISyneySpecFormRef>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建踏板规格')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const { syneySpecs, isLoading, error, count, refetch } = useSyneySpecs({ silentError: true })
  const { isCreating, createSyneySpec } = useCreateSyneySpec()
  const { isUpdating, updateSyneySpec } = useUpdateSyneySpec()
  const { isDeleting, deleteSyneySpecs } = useDeleteSyneySpecs()

  const specIds = selectedRowKeys.map(id => Number(id))
  const spec = syneySpecs?.find(item => item.id === specIds?.at(0))

  function showModal() {
    specFormRef.current?.getInstance().resetFields()
    setIsModalOpen(true)
  }

  function onSelect(keys: Key[]) {
    setSelectedRowKeys(keys)
  }

  function onFinishFuc(spec: ISyneySpec) {
    if (isEditing) {
      updateSyneySpec(spec, {
        onSuccess: () => {
          setSelectedRowKeys([])
          handleCancel()
        },
      })
    }
    else {
      createSyneySpec(spec, {
        onSuccess: () => {
          setSelectedRowKeys([])
          handleCancel()
        },
      })
    }
  }

  function handleCancel() {
    specFormRef.current?.getInstance().resetFields()
    setIsEditing(false)
    setIsModalOpen(false)
  }

  function handleOk() {
    specFormRef.current?.getInstance().submit()
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
    setIsEditing(true)
    showModal()
  }

  function handleDelete() {
    if (specIds?.length === 0) {
      message.warning(feedbackText.selectRequired('删除'))
      return
    }
    deleteSyneySpecs(specIds, {
      onSuccess: () => {
        setSelectedRowKeys([])
      },
    })
  }

  useEffect(() => {
    if (spec && isEditing) {
      specFormRef.current?.getInstance().setFieldsValue({ ...spec })
      setModalTitle('编辑踏板规格')
    }
  }, [spec, isEditing])

  const records = useMemo(() => syneySpecs || [], [syneySpecs])
  const selectedCount = selectedRowKeys.length

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
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300">件号：</span>
          <PartNoInput />
        </div>
      </div>

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <TableState
            loading={isLoading}
            error={error}
            onRetry={refetch}
          >
            <SpecTable
              data={records}
              loading={isLoading || isCreating || isUpdating || isDeleting}
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
        <SpecForm
          ref={specFormRef}
          onFinishFunc={onFinishFuc}
          isEditing={isEditing}
        />
      </Modal>
    </div>
  )
}
