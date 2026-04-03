import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance, Button } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import ExportButton from '@/ui/ExportButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useAuth } from '@/contexts/AuthContext'
import type {
  StandardTime,
  StandardTimeFormValues,
} from '@/services/apiStandardTimes'
import { exportCostAccountingToExcel } from '@/utils/costAccountingExcel'
import {
  useStandardTimesList,
  useCreateStandardTime,
  useUpdateStandardTime,
  useDeleteStandardTimes,
} from './useStandardTimes'
import StandardTimeMobileList from './StandardTimeMobileList'
import StandardTimeTable from './StandardTimeTable'
import StandardTimeForm from './StandardTimeForm'
import StandardTimeSearch from './StandardTimeSearch'

export default function StandardTimeList() {
  const { message } = App.useApp()
  const { role, employeeProfile } = useAuth()
  const isTeamLeaderMode = role === 'team_leader'
  const currentUploader = employeeProfile?.name || null

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建成本核算')
  const [isEdit, setIsEdit] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] =
    useState<FormInstance<StandardTimeFormValues> | null>(null)
  const [searchParams, setSearchParams] = useState<{
    operation?: string
    model?: string
    unmatchedOnly?: boolean
    updatedStartDate?: string
    updatedEndDate?: string
  }>({
    operation: searchParamsURL.get('operation') || undefined,
    model: searchParamsURL.get('model') || undefined,
    unmatchedOnly: searchParamsURL.get('unmatchedOnly') === 'true' || undefined,
    updatedStartDate: searchParamsURL.get('updatedStartDate') || undefined,
    updatedEndDate: searchParamsURL.get('updatedEndDate') || undefined,
  })
  const [editingRecord, setEditingRecord] = useState<StandardTime | null>(null)

  const { data, isLoading } = useStandardTimesList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateStandardTime()
  const updateMutation = useUpdateStandardTime()
  const deleteMutation = useDeleteStandardTimes()

  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
    })

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    setModalTitle(isTeamLeaderMode ? '创建理论工时' : '新建成本核算')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef, isTeamLeaderMode])

  const resetFormState = useCallback(() => {
    setIsModalOpen(false)
    setIsEdit(false)
    setEditingRecord(null)
    setSelectedRowKeys([])
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(
    (record?: StandardTime) => {
      const targetRecord =
        record || data?.items.find((item) => item.id === selectedRowKeys[0])

      if (!record && selectedRowKeys.length !== 1) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (!targetRecord) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      setEditingRecord(targetRecord)
      setSelectedRowKeys(targetRecord.id ? [targetRecord.id] : [])
      setIsEdit(true)
      setModalTitle(isTeamLeaderMode ? '编辑理论工时' : '编辑成本核算')
      setIsModalOpen(true)
    },
    [data?.items, isTeamLeaderMode, message, selectedRowKeys],
  )

  const handleDelete = useCallback(async () => {
    if (isTeamLeaderMode) {
      message.warning('班组长不能删除成本核算')
      return
    }

    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys as string[])
      message.success('成本核算删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('删除成本核算失败，请稍后重试')
      }
    }
  }, [deleteMutation, isTeamLeaderMode, message, selectedRowKeys])

  const handleExport = useCallback(async () => {
    const selectedRecords = (data?.items || []).filter((item) =>
      selectedRowKeys.includes(item.id || ''),
    )

    if (selectedRecords.length === 0) {
      message.warning('请先选择要导出的成本核算数据')
      return
    }

    try {
      setIsExporting(true)
      exportCostAccountingToExcel(selectedRecords)
      message.success(`已导出 ${selectedRecords.length} 条成本核算数据`)
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('导出成本核算失败，请稍后重试')
      }
    } finally {
      setIsExporting(false)
    }
  }, [data?.items, message, selectedRowKeys])

  const handleFinish = useCallback(
    async (values: StandardTimeFormValues) => {
      try {
        const nextValues: StandardTimeFormValues = isTeamLeaderMode
          ? {
              customer: values.customer,
              job_name: values.job_name,
              equipment_no: values.equipment_no,
              operation: values.operation,
              model: isEdit
                ? editingRecord?.model || values.model
                : values.model,
              standard_seconds: isEdit
                ? editingRecord?.standard_seconds || 0
                : 0,
              theoretical_seconds: values.theoretical_seconds,
              uploaded_by_name: isEdit
                ? editingRecord?.uploaded_by_name || null
                : currentUploader || values.uploaded_by_name || null,
              length: values.length ?? 0,
              part_no: values.part_no ?? null,
            }
          : {
              ...values,
              uploaded_by_name: isEdit
                ? editingRecord?.uploaded_by_name || null
                : currentUploader || values.uploaded_by_name || null,
            }

        if (isEdit && selectedRowKeys[0]) {
          const standardSecondsChanged =
            editingRecord?.standard_seconds !== nextValues.standard_seconds
          const operationChanged =
            editingRecord?.operation !== nextValues.operation
          const modelChanged = editingRecord?.model !== nextValues.model
          const relatedOrdersSynced =
            standardSecondsChanged || operationChanged || modelChanged

          await updateMutation.mutateAsync({
            id: selectedRowKeys[0] as string,
            values: nextValues,
          })
          message.success(
            relatedOrdersSynced
              ? '成本核算更新成功，关联工单已同步修正'
              : isTeamLeaderMode
                ? '理论工时更新成功'
                : '成本核算更新成功',
          )
        } else {
          await createMutation.mutateAsync(nextValues)
          message.success(
            isTeamLeaderMode ? '理论工时创建成功' : '成本核算创建成功',
          )
        }

        resetFormState()
      } catch (error) {
        if (error instanceof Error) {
          message.error(error.message)
        } else {
          message.error('操作失败，请稍后重试')
        }
      }
    },
    [
      createMutation,
      editingRecord,
      isEdit,
      isTeamLeaderMode,
      message,
      resetFormState,
      selectedRowKeys,
      updateMutation,
    ],
  )

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      setSelectedRowKeys([])
      const nextSearchParamsURL = new URLSearchParams(searchParamsURL)

      nextSearchParamsURL.set('page', '1')

      if (params.operation) {
        nextSearchParamsURL.set('operation', params.operation)
      } else {
        nextSearchParamsURL.delete('operation')
      }

      if (params.model) {
        nextSearchParamsURL.set('model', params.model)
      } else {
        nextSearchParamsURL.delete('model')
      }

      if (params.unmatchedOnly) {
        nextSearchParamsURL.set('unmatchedOnly', 'true')
      } else {
        nextSearchParamsURL.delete('unmatchedOnly')
      }

      if (params.updatedStartDate) {
        nextSearchParamsURL.set('updatedStartDate', params.updatedStartDate)
      } else {
        nextSearchParamsURL.delete('updatedStartDate')
      }

      if (params.updatedEndDate) {
        nextSearchParamsURL.set('updatedEndDate', params.updatedEndDate)
      } else {
        nextSearchParamsURL.delete('updatedEndDate')
      }

      setSearchParamsURL(nextSearchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    setSelectedRowKeys([])
    const nextSearchParamsURL = new URLSearchParams(searchParamsURL)

    nextSearchParamsURL.set('page', '1')
    nextSearchParamsURL.delete('operation')
    nextSearchParamsURL.delete('model')
    nextSearchParamsURL.delete('unmatchedOnly')
    nextSearchParamsURL.delete('updatedStartDate')
    nextSearchParamsURL.delete('updatedEndDate')

    setSearchParamsURL(nextSearchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      searchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      {isTeamLeaderMode ? (
        <Button
          block
          type="primary"
          className="h-11 rounded-2xl"
          onClick={handleCreate}
        >
          新建理论工时
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <AddButton handleCreate={handleCreate} />
          <EditButton title="编辑" handleEdit={() => handleEdit()} />
          <ExportButton
            handleExport={handleExport}
            loading={isExporting}
            count={selectedRowKeys.length}
          >
            导出成本核算
          </ExportButton>
          <DeleteButton
            onConfirm={handleDelete}
            isDeleting={deleteMutation.isPending}
            count={selectedRowKeys.length}
            title="删除成本核算"
            itemName="成本核算"
          />
        </div>
      )}

      <div
        className={
          isTeamLeaderMode
            ? 'rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
            : 'flex items-center gap-2'
        }
      >
        {isTeamLeaderMode ? null : (
          <span className="whitespace-nowrap text-gray-600">搜索：</span>
        )}
        <StandardTimeSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          mobile={isTeamLeaderMode}
          initialValues={searchParams}
        />
      </div>

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div
          className={
            isTeamLeaderMode
              ? 'no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain'
              : 'min-h-0 flex-1 overflow-x-auto'
          }
        >
          {isTeamLeaderMode ? (
            <StandardTimeMobileList
              loading={isLoading}
              data={data?.items || []}
              onEdit={handleEdit}
            />
          ) : (
            <StandardTimeTable
              loading={isLoading}
              data={data?.items || []}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
              rowHeight={rowHeight}
            />
          )}
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination
            total={data?.total || 0}
            pageSizeOptions={['10', '20', '50', '100', '500', '1000']}
          />
        </div>
      </div>

      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        width={isTeamLeaderMode ? 'calc(100vw - 24px)' : undefined}
        style={isTeamLeaderMode ? { top: 16, maxWidth: 520 } : undefined}
        onOk={() => formRef?.submit()}
        onCancel={resetFormState}
      >
        <StandardTimeForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={createMutation.isPending}
          isEdit={isEdit}
          initialValues={isEdit && editingRecord ? editingRecord : undefined}
          mode={isTeamLeaderMode ? 'team_leader' : 'admin'}
          currentUploader={currentUploader}
        />
      </Modal>
    </div>
  )
}
