import { useEffect, useRef, useState, useMemo } from 'react'
import { App, Modal } from 'antd'

import { ISyneySpec, ISyneySpecFormRef } from '@/types'
import SpecTable from './SpecTable'
import { useSyneySpecs } from './useSyneySpecs'
import SpecForm from './SpecForm'
import { useCreateSyneySpec } from './useCreateSpec'
import { useUpdateSyneySpec } from './useUpdateSyneySpec'
import { useDeleteSyneySpecs } from './useDeleteSyneySpecs'
import EditButton from '@ui/EditButton'
import AddButton from '@ui/AddButton'
import DeleteButton from '@ui/DeleteButton'
import PartNoInput from './PartNoInput'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useSearchParams } from 'react-router-dom'
import { Key } from 'react'

export default function SpecList() {
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  const specFormRef = useRef<ISyneySpecFormRef>(null)
  const specFormInstance = specFormRef.current?.getInstance()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建规格')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])

  const { syneySpecs, isLoading, count } = useSyneySpecs()
  const { isCreating, createSyneySpec } = useCreateSyneySpec()
  const { isUpdating, updateSyneySpec } = useUpdateSyneySpec()
  const { isDeleting, deleteSyneySpecs } = useDeleteSyneySpecs()

  const specIds = selectedRowKeys.map((id) => Number(id))
  const spec = syneySpecs?.find((item) => item.id === specIds?.at(0))

  function showModal() {
    specFormInstance?.resetFields()
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
    } else {
      createSyneySpec(spec, {
        onSuccess: () => {
          setSelectedRowKeys([])
          handleCancel()
        },
      })
    }
  }

  function handleCancel() {
    specFormInstance?.resetFields()
    setIsEditing(false)
    setIsModalOpen(false)
  }

  function handleOk() {
    specFormInstance?.submit()
  }

  function handleCreate() {
    setModalTitle('创建规格')
    setIsEditing(false)
    showModal()
  }

  function handleEdit() {
    if (specIds?.length !== 1) {
      message.warning('请选择一条数据')
      return
    }
    setIsEditing(true)
    showModal()
  }

  function handleDelete() {
    if (specIds?.length === 0) {
      message.warning('请选择至少一条数据')
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
      specFormInstance?.setFieldsValue({ ...spec })
      setModalTitle('编辑规格')
    }
  }, [spec, isEditing, specFormInstance])

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
        <DeleteButton onConfirm={handleDelete} isDeleting={isDeleting} />
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

      {/* 搜索 / 过滤栏 */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200/60 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-slate-600">筛选条件</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">件号：</span>
            <PartNoInput />
          </div>
        </div>
      </div>

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <SpecTable
            data={records}
            loading={
              isLoading || isCreating || isUpdating || isDeleting
            }
            onSelect={onSelect}
            selectedRowKeys={selectedRowKeys}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={count || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={isCreating || isUpdating}
        width={560}
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
