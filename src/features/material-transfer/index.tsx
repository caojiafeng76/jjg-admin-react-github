import { useCallback, useMemo, useState } from 'react'
import { App, Button, Splitter } from 'antd'
import { ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/16/solid'
import { useNavigate, useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import { isEmployeeSideRole } from '@/config/access'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useAllEmployees } from '@/features/workshop/EmployeeList/useEmployees'
import { useAuth } from '@/contexts/useAuth'
import {
  getMaterialTransfersForExport,
  type MaterialTransferFilters,
  type MaterialTransferInsert,
  type MaterialTransferUpdate,
  type MaterialTransferWithEmployee,
} from '@/services/apiMaterialTransfers'
import { translateErrorMessage } from '@/utils/errorHandler'
import { exportMaterialTransfersToExcel } from '@/utils/materialTransferExcel'
import {
  useCreateMaterialTransfer,
  useBatchUpdateMaterialTransfers,
  useDeleteMaterialTransfers,
  useMaterialTransfers,
  useUpdateMaterialTransfer,
  useMaterialTransferProjectNos,
  useMaterialTransferModels,
  useMaterialTransferLengths,
} from './useMaterialTransfers'
import MaterialTransferDetail from './MaterialTransferDetail'
import MaterialTransferForm from './MaterialTransferForm'
import MaterialTransferMobileList from './MaterialTransferMobileList'
import MaterialTransferSearch from './MaterialTransferSearch'
import MaterialTransferTable from './MaterialTransferTable'

export default function MaterialTransferPage() {
  const { message, modal } = App.useApp()
  const navigate = useNavigate()
  const { role, employeeProfile, user } = useAuth()
  const isEmployeeView = isEmployeeSideRole(role)
  const isOwnOnlyView = role === 'employee'
  const currentUploader = employeeProfile?.name || user?.email || null
  const fixedEmployee = useMemo(
    () =>
      isOwnOnlyView && employeeProfile?.id
        ? { id: employeeProfile.id, name: employeeProfile.name }
        : null,
    [employeeProfile?.id, employeeProfile?.name, isOwnOnlyView],
  )
  const fixedEmployeeId = fixedEmployee?.id
  const fixedEmployeeName = fixedEmployee?.name
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchFilters, setSearchFilters] = useState<MaterialTransferFilters>(
    () => ({
      employeeId: fixedEmployeeId,
    }),
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<MaterialTransferWithEmployee | null>(null)
  const [activeRecord, setActiveRecord] =
    useState<MaterialTransferWithEmployee | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { data: employeeOptions = [] } = useAllEmployees(!isOwnOnlyView)
  const { data: projectNoOptions = [] } = useMaterialTransferProjectNos()
  const { data: modelOptions = [] } = useMaterialTransferModels()
  const { data: lengthOptions = [] } = useMaterialTransferLengths()
  const { data, isLoading } = useMaterialTransfers({
    page,
    pageSize,
    filters: searchFilters,
  })
  const createMutation = useCreateMaterialTransfer()
  const updateMutation = useUpdateMaterialTransfer()
  const deleteMutation = useDeleteMaterialTransfers()
  const batchUpdateMutation = useBatchUpdateMaterialTransfers()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
  })

  const selectedCount = selectedRowKeys.length
  const records = useMemo(() => data?.items || [], [data?.items])
  const employees = useMemo(
    () => (fixedEmployee ? [fixedEmployee] : employeeOptions),
    [employeeOptions, fixedEmployee],
  )

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const initialFormValues = useMemo(() => editingRecord, [editingRecord])

  const openCreateModal = useCallback(() => {
    if (isEmployeeView) {
      navigate('/material-transfer/scan', {
        state: { returnTo: '/material-transfer' },
      })
      return
    }

    setEditingRecord(null)
    setIsModalOpen(true)
  }, [isEmployeeView, navigate])

  const openEditModal = useCallback(
    (record?: MaterialTransferWithEmployee) => {
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
        message.warning('已审核转移单不可编辑')
        return
      }

      if (isEmployeeView) {
        navigate('/material-transfer/scan', {
          state: {
            returnTo: '/material-transfer',
            editingRecord: targetRecord,
          },
        })
        return
      }

      setEditingRecord(targetRecord)
      setIsModalOpen(true)
    },
    [isEmployeeView, message, navigate, records, selectedRowKeys],
  )

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }, [])

  const handleSearch = useCallback(
    (filters: MaterialTransferFilters) => {
      setSearchFilters(
        fixedEmployeeId ? { ...filters, employeeId: fixedEmployeeId } : filters,
      )
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [fixedEmployeeId, searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchFilters(fixedEmployeeId ? { employeeId: fixedEmployeeId } : {})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    searchParamsURL.delete('pageSize')
    setSearchParamsURL(searchParamsURL)
  }, [fixedEmployeeId, searchParamsURL, setSearchParamsURL])

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
      const selectedIds = selectedRowKeys.map((key) => String(key))
      const exportRows = await getMaterialTransfersForExport(
        selectedIds.length > 0
          ? { ids: selectedIds }
          : { filters: searchFilters },
      )

      if (exportRows.length === 0) {
        message.warning('当前没有可导出的物料转移单')
        return
      }

      exportMaterialTransfersToExcel(exportRows)
      message.success(`已导出 ${exportRows.length} 条物料转移单`)
      setSelectedRowKeys([])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setIsExporting(false)
    }
  }, [message, searchFilters, selectedRowKeys])

  const handleBatchAudit = useCallback(
    (isAudited: boolean) => {
      if (selectedRowKeys.length === 0) {
        message.warning(`请选择要${isAudited ? '审核' : '反审核'}的物料转移单`)
        return
      }

      modal.confirm({
        title: `批量${isAudited ? '审核' : '反审核'}物料转移单`,
        content: `确定要将选中的 ${selectedRowKeys.length} 条物料转移单标记为${isAudited ? '已审核' : '待审核'}吗？`,
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
    async (values: MaterialTransferInsert | MaterialTransferUpdate) => {
      try {
        if (editingRecord) {
          if (isEmployeeView && editingRecord.is_audited) {
            message.warning('已审核转移单不可编辑')
            return
          }

          const operatorEmployeeIds = fixedEmployeeId
            ? [fixedEmployeeId]
            : values.operator_employee_ids
          const operatorNames = fixedEmployeeName
            ? [fixedEmployeeName]
            : values.operator_names

          if (!operatorEmployeeIds?.length || !operatorNames?.length) {
            message.warning('请选择至少一名操作人')
            return
          }

          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values: {
              ...(values as MaterialTransferUpdate),
              uploaded_by_name: editingRecord.uploaded_by_name,
              operator_employee_id: operatorEmployeeIds[0],
              operator_employee_ids: operatorEmployeeIds,
              operator_names: operatorNames,
              is_audited: isEmployeeView
                ? false
                : (values as MaterialTransferUpdate).is_audited,
            },
          })
          message.success('更新成功')
        } else {
          const createValues = values as MaterialTransferInsert
          const operatorEmployeeIds = fixedEmployeeId
            ? [fixedEmployeeId]
            : createValues.operator_employee_ids
          const operatorNames = fixedEmployeeName
            ? [fixedEmployeeName]
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
      editingRecord,
      fixedEmployeeId,
      fixedEmployeeName,
      handleCloseModal,
      currentUploader,
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
              title="编辑物料转移单"
              handleEdit={() => openEditModal()}
            />
            <ExportButton handleExport={handleExport} loading={isExporting}>
              {selectedCount > 0 ? '导出选中项' : '导出当前筛选结果'}
            </ExportButton>
            <DeleteButton
              onConfirm={() => handleDelete()}
              isDeleting={deleteMutation.isPending}
              count={selectedCount}
              title="删除物料转移单"
              itemName="转移单"
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
        <MaterialTransferSearch
          employees={employees}
          projectNoOptions={projectNoOptions}
          modelOptions={modelOptions}
          lengthOptions={lengthOptions}
          initialValues={searchFilters}
          onSearch={handleSearch}
          onReset={handleResetSearch}
          mobile={isEmployeeView}
          showEmployeeFilter={!isOwnOnlyView}
        />
      </div>

      {isEmployeeView ? null : (
        <Splitter layout="vertical" style={{ flex: 1, minHeight: 0 }}>
          <Splitter.Panel defaultSize="65%" min="30%">
            <div
              ref={tableContainerRef}
              className="flex h-full flex-col gap-2 overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-x-auto">
                <MaterialTransferTable
                  loading={isLoading}
                  data={records}
                  page={page}
                  pageSize={pageSize}
                  selectedRowKeys={selectedRowKeys}
                  onSelect={setSelectedRowKeys}
                  scrollY={scrollY}
                  activeRowId={activeRecord?.id ?? null}
                  onRowClick={setActiveRecord}
                />
              </div>
              <div ref={paginationRef} className="flex shrink-0 justify-end">
                <AppPagination total={data?.total || 0} />
              </div>
            </div>
          </Splitter.Panel>
          <Splitter.Panel min="20%">
            <div className="h-full overflow-hidden">
              <MaterialTransferDetail
                selectedRecord={activeRecord}
                onEdit={openEditModal}
              />
            </div>
          </Splitter.Panel>
        </Splitter>
      )}

      {isEmployeeView && (
        <>
          <div
            ref={tableContainerRef}
            className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain"
          >
            <MaterialTransferMobileList
              loading={isLoading}
              data={records}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              onEdit={openEditModal}
            />
          </div>
          <div ref={paginationRef} className="flex justify-center pb-1">
            <AppPagination total={data?.total || 0} />
          </div>
        </>
      )}

      {!isEmployeeView ? (
        <MaterialTransferForm
          open={isModalOpen}
          onCancel={handleCloseModal}
          onSubmit={handleSubmit}
          initialValues={initialFormValues}
          employees={employees}
          loading={isSubmitting}
          fixedOperator={fixedEmployee}
          currentUploader={currentUploader}
          canAudit={!isEmployeeView}
          mobile={false}
        />
      ) : null}
    </div>
  )
}
