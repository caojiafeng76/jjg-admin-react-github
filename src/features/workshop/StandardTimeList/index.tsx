import { useState, useCallback, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/16/solid'
import { App, Modal, FormInstance, Button, Splitter } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import ExportButton from '@/ui/ExportButton'
import PermissionButton from '@/ui/PermissionButton'
import PermissionGate from '@/ui/PermissionGate'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import { isTeamLeaderOnly } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import type {
  StandardTime,
  StandardTimeFormValues,
  ProcessStandardRecordType,
} from '@/services/apiStandardTimes'
import { getAllStandardTimesForExport } from '@/services/apiStandardTimes'
import { exportCostAccountingToExcel } from '@/utils/costAccountingExcel'
import {
  useStandardTimesList,
  useCreateStandardTime,
  useUpdateStandardTime,
  useUpdateStandardTimesLastProcess,
  useDeleteStandardTimes,
} from './useStandardTimes'
import StandardTimeMobileList from './StandardTimeMobileList'
import StandardTimeTable from './StandardTimeTable'
import StandardTimeCostDetail from './StandardTimeCostDetail'
import StandardTimeForm from './StandardTimeForm'
import StandardTimeSearch from './StandardTimeSearch'

export default function StandardTimeList() {
  const { message, modal } = App.useApp()
  const { role, employeeProfile } = useAuth()
  const isTeamLeaderMode = isTeamLeaderOnly(role)
  const currentUploader = employeeProfile?.name || null

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('新建成本核算')
  const [isEdit, setIsEdit] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isFilterExporting, setIsFilterExporting] = useState(false)
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
    partNoOnly?: boolean
    updatedStartDate?: string
    updatedEndDate?: string
    recordType?: ProcessStandardRecordType
  }>({
    operation: searchParamsURL.get('operation') || undefined,
    model: searchParamsURL.get('model') || undefined,
    unmatchedOnly: searchParamsURL.get('unmatchedOnly') === 'true' || undefined,
    partNoOnly: searchParamsURL.get('partNoOnly') === 'true' || undefined,
    updatedStartDate: searchParamsURL.get('updatedStartDate') || undefined,
    updatedEndDate: searchParamsURL.get('updatedEndDate') || undefined,
    recordType:
      (searchParamsURL.get('recordType') as ProcessStandardRecordType) ||
      undefined,
  })
  const [editingRecord, setEditingRecord] = useState<StandardTime | null>(null)
  const [activeRecord, setActiveRecord] = useState<StandardTime | null>(null)

  const { data, isLoading } = useStandardTimesList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateStandardTime()
  const updateMutation = useUpdateStandardTime()
  const lastProcessMutation = useUpdateStandardTimesLastProcess()
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

  const handleBatchLastProcess = useCallback(
    (isLastProcess: boolean) => {
      if (isTeamLeaderMode) {
        message.warning('班组长不能批量修改末道状态')
        return
      }

      if (selectedRowKeys.length === 0) {
        message.warning('请选择至少一条成本核算数据')
        return
      }

      const selectedIds = selectedRowKeys.map(String)
      const actionLabel = isLastProcess ? '设为末道' : '取消末道'

      modal.confirm({
        title: actionLabel,
        content: `确认将已选 ${selectedIds.length} 条成本核算${actionLabel}？`,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          try {
            await lastProcessMutation.mutateAsync({
              ids: selectedIds,
              isLastProcess,
            })
            message.success(`已${actionLabel} ${selectedIds.length} 条成本核算`)
            setActiveRecord((current) =>
              current?.id && selectedIds.includes(current.id)
                ? { ...current, is_last_process: isLastProcess }
                : current,
            )
            setSelectedRowKeys([])
          } catch (error) {
            if (error instanceof Error) {
              message.error(error.message)
            } else {
              message.error('更新末道状态失败，请稍后重试')
            }
          }
        },
      })
    },
    [isTeamLeaderMode, lastProcessMutation, message, modal, selectedRowKeys],
  )

  const handleExport = useCallback(async () => {
    const selectedSet = new Set(selectedRowKeys)
    const selectedRecords = (data?.items || []).filter((item) =>
      selectedSet.has(item.id || ''),
    )

    if (selectedRecords.length === 0) {
      message.warning('请先选择要导出的成本核算数据')
      return
    }

    setIsExporting(true)
    // 先让 React 渲染 loading 状态，再执行同步的 Excel 生成
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
    try {
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

  const handleFilterExport = useCallback(async () => {
    setIsFilterExporting(true)
    try {
      const records = await getAllStandardTimesForExport(searchParams)
      if (records.length === 0) {
        message.warning('当前筛选条件下无数据可导出')
        return
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
      exportCostAccountingToExcel(records)
      message.success(`已按筛选条件导出 ${records.length} 条成本核算数据`)
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('导出成本核算失败，请稍后重试')
      }
    } finally {
      setIsFilterExporting(false)
    }
  }, [message, searchParams])

  const handleFinish = useCallback(
    async (values: StandardTimeFormValues) => {
      try {
        const nextValues: StandardTimeFormValues = isTeamLeaderMode
          ? {
              customer: editingRecord?.customer ?? values.customer,
              job_name: editingRecord?.job_name ?? values.job_name,
              equipment_no: editingRecord?.equipment_no ?? values.equipment_no,
              operation: values.operation,
              model: isEdit
                ? editingRecord?.model || values.model
                : values.model,
              standard_seconds: isEdit
                ? editingRecord?.standard_seconds || 0
                : 0,
              theoretical_seconds: values.theoretical_seconds,
              labor_rate: editingRecord?.labor_rate ?? values.labor_rate ?? 0,
              labor_cost_coefficient:
                editingRecord?.labor_cost_coefficient ??
                values.labor_cost_coefficient ??
                1,
              equipment_rate:
                editingRecord?.equipment_rate ?? values.equipment_rate ?? 0,
              tool_rate: editingRecord?.tool_rate ?? values.tool_rate ?? 0,
              cutting_fluid_rate:
                editingRecord?.cutting_fluid_rate ??
                values.cutting_fluid_rate ??
                0,
              fixture_rate:
                editingRecord?.fixture_rate ?? values.fixture_rate ?? 0,
              inspection_seconds:
                editingRecord?.inspection_seconds ??
                values.inspection_seconds ??
                0,
              daily_management_cost:
                editingRecord?.daily_management_cost ??
                values.daily_management_cost ??
                0,
              daily_total_hours:
                editingRecord?.daily_total_hours ??
                values.daily_total_hours ??
                0,
              uploaded_by_name: isEdit
                ? editingRecord?.uploaded_by_name || null
                : currentUploader || values.uploaded_by_name || null,
              remark: editingRecord?.remark ?? values.remark ?? null,
              length: values.length ?? editingRecord?.length ?? 0,
              part_no: values.part_no ?? editingRecord?.part_no ?? null,
              record_type:
                editingRecord?.record_type ?? values.record_type ?? 'B',
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
      currentUploader,
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

      if (params.partNoOnly) {
        nextSearchParamsURL.set('partNoOnly', 'true')
      } else {
        nextSearchParamsURL.delete('partNoOnly')
      }

      if (params.recordType) {
        nextSearchParamsURL.set('recordType', params.recordType)
      } else {
        nextSearchParamsURL.delete('recordType')
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
    nextSearchParamsURL.delete('partNoOnly')
    nextSearchParamsURL.delete('recordType')
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
    <div className="flex h-full flex-col gap-2">
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
          <AddButton
            handleCreate={handleCreate}
            permissionKey="feature:standard-time-list.create"
          />
          <EditButton
            title="编辑"
            handleEdit={() => handleEdit()}
            permissionKey="feature:standard-time-list.edit"
          />
          <PermissionButton
            type="text"
            icon={<CheckCircleIcon className="size-4 text-green-500/80!" />}
            loading={lastProcessMutation.isPending}
            permissionKey="feature:standard-time-list.edit"
            noPermissionTip="无编辑权限"
            onClick={() => handleBatchLastProcess(true)}
          >
            设为末道
          </PermissionButton>
          <PermissionButton
            type="text"
            icon={<XCircleIcon className="size-4 text-red-500/80!" />}
            loading={lastProcessMutation.isPending}
            permissionKey="feature:standard-time-list.edit"
            noPermissionTip="无编辑权限"
            onClick={() => handleBatchLastProcess(false)}
          >
            取消末道
          </PermissionButton>
          <ExportButton
            handleExport={handleExport}
            loading={isExporting}
            count={selectedRowKeys.length}
            permissionKey="feature:standard-time-list.export-cost"
          >
            导出已选
          </ExportButton>
          <ExportButton
            handleExport={handleFilterExport}
            loading={isFilterExporting}
            permissionKey="feature:standard-time-list.export-cost"
          >
            按筛选条件导出
          </ExportButton>
          <DeleteButton
            onConfirm={handleDelete}
            isDeleting={deleteMutation.isPending}
            count={selectedRowKeys.length}
            title="删除成本核算"
            itemName="成本核算"
            permissionKey="feature:standard-time-list.delete"
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
          <span className="whitespace-nowrap text-slate-600">搜索：</span>
        )}
        <StandardTimeSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          mobile={isTeamLeaderMode}
          initialValues={searchParams}
        />
      </div>

      {isTeamLeaderMode ? (
        <div
          ref={tableContainerRef}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
        >
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <StandardTimeMobileList
              loading={isLoading}
              data={data?.items || []}
              onEdit={handleEdit}
            />
          </div>
          <div ref={paginationRef} className="flex shrink-0 justify-end">
            <AppPagination
              total={data?.total || 0}
              pageSizeOptions={['10', '20', '50', '100', '500', '1000']}
            />
          </div>
        </div>
      ) : (
        <Splitter orientation="vertical" style={{ flex: 1, minHeight: 0 }}>
          <Splitter.Panel defaultSize="65%" min="30%">
            <div
              ref={tableContainerRef}
              className="flex h-full flex-col gap-2 overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-x-auto">
                <StandardTimeTable
                  loading={isLoading}
                  data={data?.items || []}
                  selectedRowKeys={selectedRowKeys}
                  onSelect={setSelectedRowKeys}
                  page={page}
                  pageSize={pageSize}
                  scrollY={scrollY}
                  rowHeight={rowHeight}
                  activeRowId={activeRecord?.id ?? null}
                  onRowClick={setActiveRecord}
                />
              </div>
              <div ref={paginationRef} className="flex shrink-0 justify-end">
                <AppPagination
                  total={data?.total || 0}
                  pageSizeOptions={['10', '20', '50', '100', '500', '1000']}
                />
              </div>
            </div>
          </Splitter.Panel>
          <Splitter.Panel min="20%">
            <div className="h-full overflow-hidden">
              <PermissionGate permissionKey="field:standard-time-list.cost-detail.view">
                <StandardTimeCostDetail selectedRecord={activeRecord} />
              </PermissionGate>
            </div>
          </Splitter.Panel>
        </Splitter>
      )}

      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnHidden
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
