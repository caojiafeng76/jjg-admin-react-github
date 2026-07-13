import { useCallback, useMemo, useState, type Key } from 'react'
import {
  ArrowPathIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@heroicons/react/16/solid'
import { App, Button } from 'antd'
import { useSearchParams } from 'react-router-dom'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import { useAllEmployees } from '@/features/workshop/EmployeeList/useEmployees'
import { useTableHeight } from '@/hooks/useTableHeight'
import { translateErrorMessage } from '@/utils/errorHandler'
import {
  getQualityIssueRecordsForExport,
  type QualityIssueAuditStatus,
  type QualityIssueRecord,
  type QualityIssueRecordFormValues,
  type QualityIssueRecordSearchParams,
} from '@/services/apiQualityIssueRecords'
import IssueRecordForm from './IssueRecordForm'
import IssueRecordSearch, { AUDIT_STATUS_LABELS } from './IssueRecordSearch'
import IssueRecordTable from './IssueRecordTable'
import {
  useCreateQualityIssueRecord,
  useDeleteQualityIssueRecords,
  useQualityIssueRecordList,
  useQualityIssueRecordOrderOptions,
  useUpdateQualityIssueRecordAuditStatus,
  useUpdateQualityIssueRecord,
} from './useQualityIssueRecords'

const BATCH_AUDIT_ACTION_LABELS: Record<QualityIssueAuditStatus, string> = {
  approved: '审核',
  pending: '待审',
  rejected: '驳回',
}

const QUALITY_ISSUE_EXPORT_MESSAGE_KEY = 'quality-issue-record-export'

const loadQualityIssueRecordExcel = () =>
  import('@/utils/qualityIssueRecordExcel')

const preloadQualityIssueRecordExcel = () => {
  void loadQualityIssueRecordExcel()
}

export default function QualityIssueRecordPage() {
  const { message, modal } = App.useApp()
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 50
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [searchParams, setSearchParams] =
    useState<QualityIssueRecordSearchParams>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [editingRecord, setEditingRecord] = useState<QualityIssueRecord | null>(
    null,
  )

  const { data: employees = [] } = useAllEmployees()
  const { data: orderOptions = [], isLoading: isLoadingOrders } =
    useQualityIssueRecordOrderOptions()
  const { data, isLoading } = useQualityIssueRecordList({
    page,
    pageSize,
    searchParams,
  })
  const createMutation = useCreateQualityIssueRecord()
  const updateMutation = useUpdateQualityIssueRecord()
  const auditStatusMutation = useUpdateQualityIssueRecordAuditStatus()
  const deleteMutation = useDeleteQualityIssueRecords()
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 50,
  })

  const records = useMemo(() => data?.items || [], [data?.items])
  const total = data?.total || 0
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const openCreateModal = useCallback(() => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [])

  const openEditModal = useCallback(
    (record?: QualityIssueRecord) => {
      const targetRecord =
        record || records.find((item) => item.id === selectedRowKeys[0])

      if (!targetRecord || (!record && selectedRowKeys.length !== 1)) {
        message.warning('请选择一条质量问题记录进行编辑')
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
    (params: QualityIssueRecordSearchParams) => {
      setSearchParams(params)
      setSelectedRowKeys([])
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    setSelectedRowKeys([])
    searchParamsURL.set('page', '1')
    searchParamsURL.delete('pageSize')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  const handleSubmit = useCallback(
    async (values: QualityIssueRecordFormValues) => {
      try {
        if (editingRecord) {
          await updateMutation.mutateAsync({
            id: editingRecord.id,
            values,
          })
          message.success('更新成功')
        } else {
          await createMutation.mutateAsync(values)
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
    [createMutation, editingRecord, handleCloseModal, message, updateMutation],
  )

  const handleDelete = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条质量问题记录')
      return
    }

    try {
      await deleteMutation.mutateAsync(selectedRowKeys.map(String))
      message.success('删除成功')
      setSelectedRowKeys([])
    } catch (error) {
      message.error(error instanceof Error ? error.message : '删除失败')
    }
  }, [deleteMutation, message, selectedRowKeys])

  const handleBatchAuditStatus = useCallback(
    (auditStatus: QualityIssueAuditStatus) => {
      const actionLabel = BATCH_AUDIT_ACTION_LABELS[auditStatus]

      if (selectedRowKeys.length === 0) {
        message.warning(`请选择要批量${actionLabel}的质量问题记录`)
        return
      }

      modal.confirm({
        title: `批量${actionLabel}质量问题记录`,
        content: `确定要将选中的 ${selectedRowKeys.length} 条质量问题记录改为${AUDIT_STATUS_LABELS[auditStatus]}吗？`,
        okText: '确定',
        cancelText: '取消',
        okButtonProps: {
          danger: auditStatus === 'rejected',
          loading: auditStatusMutation.isPending,
        },
        onOk: async () => {
          try {
            await auditStatusMutation.mutateAsync({
              auditStatus,
              ids: selectedRowKeys.map(String),
            })
            message.success(`批量${actionLabel}成功`)
            setSelectedRowKeys([])
          } catch (error) {
            message.error(
              error instanceof Error ? error.message : `批量${actionLabel}失败`,
            )
          }
        },
      })
    },
    [auditStatusMutation, message, modal, selectedRowKeys],
  )

  const handleExport = useCallback(async () => {
    if (total === 0) {
      message.warning('当前没有可导出的质量问题记录')
      return
    }

    try {
      setIsExporting(true)
      message.open({
        key: QUALITY_ISSUE_EXPORT_MESSAGE_KEY,
        type: 'loading',
        content: '正在导出当前筛选结果...',
        duration: 0,
      })

      const exportRows = await getQualityIssueRecordsForExport(searchParams)

      if (exportRows.length === 0) {
        message.warning({
          key: QUALITY_ISSUE_EXPORT_MESSAGE_KEY,
          content: '当前没有可导出的质量问题记录',
        })
        return
      }

      const { exportQualityIssueRecordsToExcel } =
        await loadQualityIssueRecordExcel()
      exportQualityIssueRecordsToExcel(exportRows)
      message.success({
        key: QUALITY_ISSUE_EXPORT_MESSAGE_KEY,
        content: `已导出 ${exportRows.length} 条质量问题记录`,
      })
    } catch (error) {
      message.error({
        key: QUALITY_ISSUE_EXPORT_MESSAGE_KEY,
        content: error instanceof Error ? error.message : '导出失败',
      })
    } finally {
      setIsExporting(false)
    }
  }, [message, searchParams, total])

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <AddButton handleCreate={openCreateModal} />
          <EditButton title="编辑" handleEdit={() => openEditModal()} />
          <Button
            type="text"
            icon={<ShieldCheckIcon className="size-4 text-green-500/80!" />}
            loading={auditStatusMutation.isPending}
            onClick={() => handleBatchAuditStatus('approved')}
          >
            批量审核
          </Button>
          <Button
            type="text"
            icon={<ArrowPathIcon className="size-4 text-amber-500/80!" />}
            loading={auditStatusMutation.isPending}
            onClick={() => handleBatchAuditStatus('pending')}
          >
            批量待审
          </Button>
          <Button
            type="text"
            icon={<XCircleIcon className="size-4 text-red-500/80!" />}
            loading={auditStatusMutation.isPending}
            onClick={() => handleBatchAuditStatus('rejected')}
          >
            批量驳回
          </Button>
          <ExportButton
            handleExport={handleExport}
            loading={isExporting}
            disabled={isLoading || total === 0}
            onPreload={preloadQualityIssueRecordExcel}
          >
            导出当前筛选结果{total > 0 ? ` (${total})` : ''}
          </ExportButton>
          <DeleteButton
            isDeleting={deleteMutation.isPending}
            count={selectedRowKeys.length}
            title="删除质量问题记录"
            itemName="质量问题记录"
            onConfirm={handleDelete}
          />
        </div>

        <div className="w-full">
          <IssueRecordSearch
            employees={employees}
            initialValues={searchParams}
            onReset={handleResetSearch}
            onSearch={handleSearch}
          />
        </div>
      </div>

      <div ref={tableContainerRef} className="min-h-0 flex-1">
        <IssueRecordTable
          data={records}
          loading={isLoading}
          onEdit={openEditModal}
          onSelect={setSelectedRowKeys}
          page={page}
          pageSize={pageSize}
          scrollY={scrollY}
          selectedRowKeys={selectedRowKeys}
        />
      </div>

      <div ref={paginationRef}>
        <AppPagination
          total={total}
          defaultPageSize={50}
          pageSizeOptions={['20', '50', '100', '200']}
        />
      </div>

      <IssueRecordForm
        employees={employees}
        initialValues={editingRecord}
        loadingOrders={isLoadingOrders}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
        open={isModalOpen}
        orderOptions={orderOptions}
        submitting={isSubmitting}
      />
    </div>
  )
}
