import { useCallback, useMemo, useState } from 'react'
import { App, Button, Splitter } from 'antd'
import { ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/16/solid'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { useAuth } from '@/contexts/useAuth'
import {
  getPrecisionCuttingTransfersForExport,
  type PrecisionCuttingTransferFilters,
  type PrecisionCuttingTransferInsert,
  type PrecisionCuttingTransferRow,
  type PrecisionCuttingTransferUpdate,
} from '@/services/apiPrecisionCuttingTransfers'
import { translateErrorMessage } from '@/utils/errorHandler'
import { exportPrecisionCuttingTransfersToExcel } from '@/utils/precisionCuttingTransferExcel'
import {
  useBatchUpdatePrecisionCuttingTransfers,
  useCreatePrecisionCuttingTransfer,
  useDeletePrecisionCuttingTransfers,
  usePrecisionCuttingTransfers,
  useUpdatePrecisionCuttingTransfer,
} from './useMaterialTransfers'
import MaterialTransferDetail from './MaterialTransferDetail'
import MaterialTransferForm from './MaterialTransferForm'
import MaterialTransferSearch from './MaterialTransferSearch'
import MaterialTransferTable from './MaterialTransferTable'

export default function MaterialTransferPage() {
  const { message, modal } = App.useApp()
  const { user } = useAuth()
  const currentUploader = user?.email || null
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchFilters, setSearchFilters] =
    useState<PrecisionCuttingTransferFilters>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] =
    useState<PrecisionCuttingTransferRow | null>(null)
  const [activeRecord, setActiveRecord] =
    useState<PrecisionCuttingTransferRow | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading } = usePrecisionCuttingTransfers({
    page,
    pageSize,
    filters: searchFilters,
  })
  const createMutation = useCreatePrecisionCuttingTransfer()
  const updateMutation = useUpdatePrecisionCuttingTransfer()
  const deleteMutation = useDeletePrecisionCuttingTransfers()
  const batchUpdateMutation = useBatchUpdatePrecisionCuttingTransfers()

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 10,
    summaryRowHeight: 39,
  })

  const selectedCount = selectedRowKeys.length
  const records = useMemo(() => data?.items || [], [data?.items])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const initialFormValues = useMemo(() => editingRecord, [editingRecord])

  const openCreateModal = useCallback(() => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback(
    (record?: PrecisionCuttingTransferRow) => {
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

      setEditingRecord(targetRecord)
      setIsModalOpen(true)
    },
    [message, records, selectedRowKeys],
  )

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingRecord(null)
  }, [])

  const handleSearch = useCallback(
    (filters: PrecisionCuttingTransferFilters) => {
      setSearchFilters(filters)
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchFilters({})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    searchParamsURL.delete('pageSize')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  const handleDelete = useCallback(
    (ids?: string[]) => {
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
    [deleteMutation, message, selectedRowKeys],
  )

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true)
      const selectedIds = selectedRowKeys.map((key) => String(key))
      const exportRows = await getPrecisionCuttingTransfersForExport(
        selectedIds.length > 0
          ? { ids: selectedIds }
          : { filters: searchFilters },
      )

      if (exportRows.length === 0) {
        message.warning('当前没有可导出的精切转移单')
        return
      }

      exportPrecisionCuttingTransfersToExcel(exportRows)
      message.success(`已导出 ${exportRows.length} 条精切转移单`)
      setSelectedRowKeys([])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setIsExporting(false)
    }
  }, [message, searchFilters, selectedRowKeys])

  const handleBatchAudit = useCallback(
    (isAudited: boolean) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      if (selectedRowKeys.length === 0) {
        message.warning(`请选择要${isAudited ? '审核' : '反审核'}的精切转移单`)
        return
      }

      modal.confirm({
        title: `批量${isAudited ? '审核' : '反审核'}精切转移单`,
        content: `确定要将选中的 ${selectedRowKeys.length} 条精切转移单标记为${isAudited ? '已审核' : '待审核'}吗？`,
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
    [
      batchUpdateMutation,
      message,
      modal,
      selectedRowKeys,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  const handleSubmit = useCallback(
    async (
      values: PrecisionCuttingTransferInsert | PrecisionCuttingTransferUpdate,
    ) => {
      if (viewerDenied) {
        message.warning(viewerOperationTip)
        return
      }

      try {
        if (editingRecord) {
          if (!values.operator_names?.length) {
            message.warning('请选择至少一名操作人')
            return
          }

          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values: {
              ...(values as PrecisionCuttingTransferUpdate),
              uploaded_by_name: editingRecord.uploaded_by_name,
              operator_names: values.operator_names,
              is_audited: (values as PrecisionCuttingTransferUpdate).is_audited,
            },
          })
          message.success('更新成功')
        } else {
          const createValues = values as PrecisionCuttingTransferInsert

          if (!createValues.operator_names?.length) {
            message.warning('请选择至少一名操作人')
            return
          }

          await createMutation.mutateAsync({
            ...createValues,
            operator_names: createValues.operator_names,
            uploaded_by_name:
              currentUploader || createValues.uploaded_by_name || null,
            is_audited: createValues.is_audited,
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
      handleCloseModal,
      currentUploader,
      message,
      updateMutation,
      viewerDenied,
      viewerOperationTip,
    ],
  )

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={openCreateModal} />
        <Button
          type="text"
          icon={<ShieldCheckIcon className="size-4 text-green-500/80!" />}
          onClick={() => handleBatchAudit(true)}
          loading={batchUpdateMutation.isPending}
          disabled={viewerDenied}
        >
          批量审核
        </Button>
        <Button
          type="text"
          icon={<ArrowPathIcon className="size-4 text-amber-500/80!" />}
          onClick={() => handleBatchAudit(false)}
          loading={batchUpdateMutation.isPending}
          disabled={viewerDenied}
        >
          批量反审核
        </Button>
        <EditButton title="编辑精切转移单" handleEdit={() => openEditModal()} />
        <ExportButton handleExport={handleExport} loading={isExporting}>
          {selectedCount > 0 ? '导出选中项' : '导出当前筛选结果'}
        </ExportButton>
        <DeleteButton
          onConfirm={() => handleDelete()}
          isDeleting={deleteMutation.isPending}
          count={selectedCount}
          title="删除精切转移单"
          itemName="转移单"
        />
      </div>

      <div>
        <MaterialTransferSearch
          initialValues={searchFilters}
          onSearch={handleSearch}
          onReset={handleResetSearch}
        />
      </div>

      <Splitter
        orientation="vertical"
        style={{ flex: 1, minHeight: 0 }}
        styles={{ panel: { overflow: 'hidden' } }}
      >
        <Splitter.Panel defaultSize="65%" min="30%">
          <div
            ref={tableContainerRef}
            className="flex h-full flex-col gap-2 overflow-hidden"
          >
            <div className="min-h-0 flex-1 overflow-hidden">
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
              editDisabled={viewerDenied}
            />
          </div>
        </Splitter.Panel>
      </Splitter>

      <MaterialTransferForm
        open={isModalOpen}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
        initialValues={initialFormValues}
        loading={isSubmitting}
        currentUploader={currentUploader}
        canAudit
      />
    </div>
  )
}
