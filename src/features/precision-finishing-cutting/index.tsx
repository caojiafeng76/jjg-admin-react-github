import { useCallback, useMemo, useState } from 'react'
import { App, Button, Card, Statistic } from 'antd'
import { ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/16/solid'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import { isEmployeeSideRole } from '@/config/access'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useAllEmployees } from '@/features/workshop/EmployeeList/useEmployees'
import { useAuth } from '@/contexts/AuthContext'
import {
  getPrecisionFinishingCuttingsForExport,
  type PrecisionFinishingCuttingFilters,
  type PrecisionFinishingCuttingInsert,
  type PrecisionFinishingCuttingUpdate,
  type PrecisionFinishingCuttingWithEmployee,
} from '@/services/apiPrecisionFinishingCuttings'
import { translateErrorMessage } from '@/utils/errorHandler'
import { exportPrecisionFinishingCuttingsToExcel } from '@/utils/precisionFinishingCuttingExcel'
import PrecisionFinishingCuttingForm from './PrecisionFinishingCuttingForm'
import PrecisionFinishingCuttingMobileList from './PrecisionFinishingCuttingMobileList'
import PrecisionFinishingCuttingSearch from './PrecisionFinishingCuttingSearch'
import PrecisionFinishingCuttingTable from './PrecisionFinishingCuttingTable'
import {
  useBatchUpdatePrecisionFinishingCuttings,
  useCreatePrecisionFinishingCutting,
  useDeletePrecisionFinishingCuttings,
  usePrecisionFinishingCuttingQuantityStats,
  usePrecisionFinishingCuttings,
  useUpdatePrecisionFinishingCutting,
} from './usePrecisionFinishingCuttings'

export default function PrecisionFinishingCuttingPage() {
  const { message, modal } = App.useApp()
  const { role, employeeProfile, user } = useAuth()
  const isEmployeeView = isEmployeeSideRole(role)
  const isOwnOnlyView = role === 'employee'
  const currentUploader = employeeProfile?.name || user?.email || null
  const fixedEmployee =
    isOwnOnlyView && employeeProfile?.id
      ? { id: employeeProfile.id, name: employeeProfile.name }
      : null
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchFilters, setSearchFilters] =
    useState<PrecisionFinishingCuttingFilters>(() => ({
      employeeId: fixedEmployee?.id,
    }))
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<PrecisionFinishingCuttingWithEmployee | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { data: employeeOptions = [] } = useAllEmployees(!isOwnOnlyView)
  const { data, isLoading } = usePrecisionFinishingCuttings({
    page,
    pageSize,
    filters: searchFilters,
  })
  const createMutation = useCreatePrecisionFinishingCutting()
  const updateMutation = useUpdatePrecisionFinishingCutting()
  const deleteMutation = useDeletePrecisionFinishingCuttings()
  const batchUpdateMutation = useBatchUpdatePrecisionFinishingCuttings()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  const selectedCount = selectedRowKeys.length
  const selectedIds = useMemo(
    () => selectedRowKeys.map((key) => String(key)),
    [selectedRowKeys],
  )
  const records = useMemo(() => data?.items || [], [data?.items])
  const employees = useMemo(
    () => (fixedEmployee ? [fixedEmployee] : employeeOptions),
    [employeeOptions, fixedEmployee],
  )

  const { data: filteredQuantityStats } =
    usePrecisionFinishingCuttingQuantityStats({
      filters: searchFilters,
    })
  const { data: selectedQuantityStats } =
    usePrecisionFinishingCuttingQuantityStats({
      ids: selectedIds,
      enabled: selectedIds.length > 0,
    })

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const initialFormValues = useMemo(() => editingRecord, [editingRecord])

  const openCreateModal = useCallback(() => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback(
    (record?: PrecisionFinishingCuttingWithEmployee) => {
      const targetRecord =
        record || records.find((item) => item.id === selectedRowKeys[0])

      if (!targetRecord) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (!record && selectedRowKeys.length !== 1) {
        message.warning('请选择一条数据进行编辑')
        return
      }

      if (isEmployeeView && targetRecord.is_audited) {
        message.warning('已审核切割单不可编辑')
        return
      }

      setEditingRecord(targetRecord)
      setIsModalOpen(true)
    },
    [isEmployeeView, message, records, selectedRowKeys],
  )

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }, [])

  const handleSearch = useCallback(
    (filters: PrecisionFinishingCuttingFilters) => {
      setSearchFilters(
        fixedEmployee?.id
          ? { ...filters, employeeId: fixedEmployee.id }
          : filters,
      )
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [fixedEmployee?.id, searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchFilters(fixedEmployee?.id ? { employeeId: fixedEmployee.id } : {})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    searchParamsURL.delete('pageSize')
    setSearchParamsURL(searchParamsURL)
  }, [fixedEmployee?.id, searchParamsURL, setSearchParamsURL])

  const handleDelete = useCallback(
    (ids?: string[]) => {
      if (isEmployeeView) {
        message.warning('当前角色没有删除权限')
        return
      }

      const deleteIds = ids || selectedRowKeys

      if (deleteIds.length === 0) {
        message.warning('请选择至少一条数据')
        return
      }

      deleteMutation.mutate(deleteIds as string[], {
        onSuccess: () => {
          message.success('删除成功')
          setSelectedRowKeys([])
        },
        onError: (error) => {
          message.error(error instanceof Error ? error.message : '删除失败')
        },
      })
    },
    [deleteMutation, isEmployeeView, message, selectedRowKeys],
  )

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true)
      const exportRows = await getPrecisionFinishingCuttingsForExport(
        selectedIds.length > 0
          ? { ids: selectedIds }
          : { filters: searchFilters },
      )

      if (exportRows.length === 0) {
        message.warning('当前没有可导出的精加工切割单')
        return
      }

      exportPrecisionFinishingCuttingsToExcel(exportRows)
      message.success(`已导出 ${exportRows.length} 条精加工切割单`)
      setSelectedRowKeys([])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setIsExporting(false)
    }
  }, [message, searchFilters, selectedIds])

  const handleBatchAudit = useCallback(
    (isAudited: boolean) => {
      if (selectedRowKeys.length === 0) {
        message.warning(
          `请选择要${isAudited ? '审核' : '反审核'}的精加工切割单`,
        )
        return
      }

      modal.confirm({
        title: `批量${isAudited ? '审核' : '反审核'}精加工切割单`,
        content: `确定要将选中的 ${selectedRowKeys.length} 条精加工切割单标记为${isAudited ? '已审核' : '待审核'}吗？`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          try {
            await batchUpdateMutation.mutateAsync({
              ids: selectedRowKeys as string[],
              values: {
                is_audited: isAudited,
                audited_at: isAudited ? undefined : null,
              },
            })
            message.success(`批量${isAudited ? '审核' : '反审核'}成功`)
            setSelectedRowKeys([])
          } catch (error) {
            message.error(
              error instanceof Error
                ? error.message
                : `批量${isAudited ? '审核' : '反审核'}失败`,
            )
          }
        },
      })
    },
    [batchUpdateMutation, message, modal, selectedRowKeys],
  )

  const handleSubmit = useCallback(
    async (
      values: PrecisionFinishingCuttingInsert | PrecisionFinishingCuttingUpdate,
    ) => {
      try {
        if (editingRecord) {
          if (isEmployeeView && editingRecord.is_audited) {
            message.warning('已审核切割单不可编辑')
            return
          }

          const operatorEmployeeIds = fixedEmployee?.id
            ? [fixedEmployee.id]
            : values.operator_employee_ids
          const operatorNames = fixedEmployee?.name
            ? [fixedEmployee.name]
            : values.operator_names

          if (!operatorEmployeeIds?.length || !operatorNames?.length) {
            message.warning('请选择至少一名操作人')
            return
          }

          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values: {
              ...(values as PrecisionFinishingCuttingUpdate),
              uploaded_by_name: editingRecord.uploaded_by_name,
              operator_employee_id: operatorEmployeeIds[0],
              operator_employee_ids: operatorEmployeeIds,
              operator_names: operatorNames,
              is_audited: isEmployeeView
                ? false
                : (values as PrecisionFinishingCuttingUpdate).is_audited,
            },
          })
          message.success('更新成功')
        } else {
          const createValues = values as PrecisionFinishingCuttingInsert
          const operatorEmployeeIds = fixedEmployee?.id
            ? [fixedEmployee.id]
            : createValues.operator_employee_ids
          const operatorNames = fixedEmployee?.name
            ? [fixedEmployee.name]
            : createValues.operator_names

          if (!operatorEmployeeIds?.length || !operatorNames?.length) {
            message.warning('请选择至少一名操作人')
            return
          }

          await createMutation.mutateAsync({
            ...createValues,
            operator_employee_id: operatorEmployeeIds[0],
            operator_employee_ids: operatorEmployeeIds,
            operator_names: operatorNames,
            uploaded_by_name:
              currentUploader || createValues.uploaded_by_name || null,
            is_audited: isEmployeeView ? false : createValues.is_audited,
          })
          message.success('创建成功')
        }

        handleCloseModal()
        setSelectedRowKeys([])
      } catch (error) {
        message.error(
          error instanceof Error
            ? translateErrorMessage(error.message)
            : editingRecord
              ? '更新失败'
              : '创建失败',
        )
      }
    },
    [
      createMutation,
      currentUploader,
      editingRecord,
      fixedEmployee?.id,
      fixedEmployee?.name,
      handleCloseModal,
      isEmployeeView,
      message,
      updateMutation,
    ],
  )

  return (
    <div
      className={
        isEmployeeView
          ? 'grid h-full grid-rows-[auto_auto_1fr_auto] gap-3 p-3'
          : 'flex h-full flex-col gap-3 overflow-hidden'
      }
    >
      <div
        className={isEmployeeView ? '' : 'flex flex-wrap items-center gap-2'}
      >
        {isEmployeeView ? (
          <Button
            block
            type="primary"
            className="h-11 rounded-2xl"
            onClick={openCreateModal}
          >
            新建
          </Button>
        ) : (
          <>
            <AddButton handleCreate={openCreateModal} />
            <Button
              type="text"
              icon={<ShieldCheckIcon className="size-4 text-green-500/80!" />}
              onClick={() => handleBatchAudit(true)}
              loading={batchUpdateMutation.isPending}
            >
              批量审核
            </Button>
            <Button
              type="text"
              icon={<ArrowPathIcon className="size-4 text-amber-500/80!" />}
              onClick={() => handleBatchAudit(false)}
              loading={batchUpdateMutation.isPending}
            >
              批量反审核
            </Button>
            <EditButton
              title="编辑精加工切割单"
              handleEdit={() => openEditModal()}
            />
            <ExportButton handleExport={handleExport} loading={isExporting}>
              {selectedCount > 0 ? '导出选中项' : '导出当前筛选结果'}
            </ExportButton>
            <DeleteButton
              onConfirm={() => handleDelete()}
              isDeleting={deleteMutation.isPending}
              count={selectedCount}
              title="删除精加工切割单"
              itemName="切割单"
            />
          </>
        )}
      </div>

      <div
        className={
          isEmployeeView
            ? 'rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]'
            : ''
        }
      >
        <PrecisionFinishingCuttingSearch
          employees={employees}
          initialValues={searchFilters}
          onSearch={handleSearch}
          onReset={handleResetSearch}
          mobile={isEmployeeView}
          showEmployeeFilter={!isOwnOnlyView}
        />
      </div>

      {isEmployeeView ? null : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card size="small">
            <Statistic
              title={`当前筛选总数量${filteredQuantityStats ? ` / ${filteredQuantityStats.totalRecords} 条` : ''}`}
              value={filteredQuantityStats?.totalQuantity || 0}
            />
          </Card>
          <Card size="small">
            <Statistic
              title={
                selectedCount > 0
                  ? `当前勾选总数量 / ${selectedCount} 条`
                  : '当前勾选总数量'
              }
              value={selectedQuantityStats?.totalQuantity || 0}
            />
          </Card>
        </div>
      )}

      <div
        ref={tableContainerRef}
        className={
          isEmployeeView
            ? 'no-scrollbar min-h-0 overflow-y-auto overscroll-contain'
            : 'min-h-0 flex-1 overflow-hidden'
        }
      >
        {isEmployeeView ? (
          <PrecisionFinishingCuttingMobileList
            loading={isLoading}
            data={records}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
            onEdit={openEditModal}
          />
        ) : (
          <PrecisionFinishingCuttingTable
            loading={isLoading}
            data={records}
            page={page}
            pageSize={pageSize}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
            onEdit={openEditModal}
            scrollY={scrollY}
          />
        )}
      </div>

      <div
        ref={paginationRef}
        className={isEmployeeView ? 'flex justify-center pb-1' : ''}
      >
        <AppPagination total={data?.total || 0} />
      </div>

      <PrecisionFinishingCuttingForm
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
        initialValues={initialFormValues}
        employees={employees}
        loading={isSubmitting}
        fixedOperator={fixedEmployee}
        currentUploader={currentUploader}
        canAudit={!isEmployeeView}
        mobile={isEmployeeView}
      />
    </div>
  )
}
