import type { FormInstance, TableColumnsType } from 'antd'
import type { JintanInventoryAdjustFormValues } from '@/features/jintan/JintanInventoryAdjustForm'
import type {
  SyneyMaterialsInventory,
  SyneyMaterialsInventoryImportRow,
} from '@/services/apiSyneyMaterialsInventory'
import type { SyneyMaterialsSearchFilters } from '@/services/syneyMaterialsSearchFields'
import { App, Modal } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import JintanInventoryAdjustForm from '@/features/jintan/JintanInventoryAdjustForm'
import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { getSyneyMaterialsInventoryForExport } from '@/services/apiSyneyMaterialsInventory'
import AppPagination from '@/ui/AppPagination'
import EditButton from '@/ui/EditButton'
import ExportButton from '@/ui/ExportButton'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { formatSyneyMaterialLabel } from '../display'
import { loadSyneyMaterialsExcel, preloadSyneyMaterialsExcel } from '../loadSyneyMaterialsExcel'
import { SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY } from '../permissions'
import SyneyMaterialsExcelImport from '../SyneyMaterialsExcelImport'
import SyneyMaterialsSearch from '../SyneyMaterialsSearch'
import { useSyneyMaterialsListParams } from '../useSyneyMaterialsListParams'
import SyneyMaterialsInventoryTable from './SyneyMaterialsInventoryTable'
import {
  useImportSyneyMaterialsInventory,
  useSyneyMaterialsInventoryList,
  useUpdateSyneyMaterialsInventory,
} from './useSyneyMaterialsInventory'

const ENTITY = '材料库存'

const IMPORT_COLUMNS: TableColumnsType<SyneyMaterialsInventoryImportRow & { _idx: number }> = [
  { title: '#', dataIndex: '_idx', width: 60, render: (value: number) => value + 1 },
  { title: '品名', dataIndex: 'material_name', width: 200 },
  { title: '规格', dataIndex: 'specification', width: 160 },
  { title: '库存数量', dataIndex: 'quantity', width: 100, align: 'right' },
  { title: '备注', dataIndex: 'remarks' },
]

export default function SyneyMaterialsInventoryPcPage() {
  const { message } = App.useApp()
  const canManage = usePermission(SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const { page, pageSize, filters, setFilters, stepBackIfEmpty }
    = useSyneyMaterialsListParams()

  const [editingRecord, setEditingRecord] = useState<SyneyMaterialsInventory | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [formRef, setFormRef]
    = useState<FormInstance<JintanInventoryAdjustFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)

  const { data, isLoading, error, refetch } = useSyneyMaterialsInventoryList({
    page,
    pageSize,
    filters,
  })
  const updateMutation = useUpdateSyneyMaterialsInventory()
  const importMutation = useImportSyneyMaterialsInventory()

  const { tableContainerRef, paginationRef, scrollY, rowHeight }
    = useTableHeight({ targetRowCount: 10 })

  useEffect(() => {
    stepBackIfEmpty(data?.items.length)
  }, [data, stepBackIfEmpty])

  const guard = useCallback(() => {
    if (viewerDenied) {
      message.warning(viewerOperationTip)
      return false
    }
    if (!canManage) {
      message.warning('无材料库存操作权限')
      return false
    }
    return true
  }, [canManage, message, viewerDenied, viewerOperationTip])

  const closeModal = useCallback(() => {
    setEditingRecord(null)
    setSelectedRowKeys([])
    setFormError(null)
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    const record = selectedRowKeys.length === 1
      ? data?.items.find(item => item.id === selectedRowKeys[0])
      : undefined
    if (!record) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    setFormError(null)
    setEditingRecord(record)
  }, [data?.items, message, selectedRowKeys])

  const handleFinish = useCallback(
    async (values: JintanInventoryAdjustFormValues) => {
      if (!guard() || !editingRecord)
        return
      try {
        await updateMutation.mutateAsync({ id: editingRecord.id, values })
        message.success(feedbackText.updated(ENTITY))
        closeModal()
      }
      catch (submitError) {
        setFormError(submitError)
      }
    },
    [closeModal, editingRecord, guard, message, updateMutation],
  )

  const handleImport = useCallback(
    async (rows: SyneyMaterialsInventoryImportRow[]) => {
      if (!guard())
        return
      try {
        await importMutation.mutateAsync(rows)
        message.success(feedbackText.imported(ENTITY, rows.length))
        setSelectedRowKeys([])
      }
      catch (importError) {
        message.error(getUserErrorMessage(importError, feedbackText.failed('导入', ENTITY)))
      }
    },
    [guard, importMutation, message],
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const [rows, { exportSyneyMaterialsInventoryToExcel }] = await Promise.all([
        getSyneyMaterialsInventoryForExport(filters),
        loadSyneyMaterialsExcel(),
      ])
      if (rows.length === 0) {
        message.warning('当前没有可导出的材料库存')
        return
      }
      exportSyneyMaterialsInventoryToExcel(rows)
      message.success(feedbackText.exported(ENTITY, rows.length))
    }
    catch (exportError) {
      message.error(getUserErrorMessage(exportError, feedbackText.failed('导出', ENTITY)))
    }
    finally {
      setIsExporting(false)
    }
  }, [filters, message])

  const handleSearch = useCallback(
    (next?: SyneyMaterialsSearchFilters) => {
      setSelectedRowKeys([])
      setFilters(next)
    },
    [setFilters],
  )

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2">
        <EditButton
          title="编辑材料库存"
          handleEdit={handleEdit}
          permissionKey={SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY}
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY}
          onPreload={preloadSyneyMaterialsExcel}
        >
          导出 Excel
        </ExportButton>
        <SyneyMaterialsExcelImport<SyneyMaterialsInventoryImportRow>
          title="批量导入材料库存"
          tip="按「品名 + 规格」匹配已有材料资料并覆盖库存数量与备注；资料不存在的行会导致整批导入失败；数量差额会记入调整记录。"
          columns={IMPORT_COLUMNS}
          parse={(excel, file) => excel.parseSyneyMaterialsInventoryExcel(file)}
          downloadTemplate={excel => excel.downloadSyneyMaterialsInventoryTemplate()}
          onImport={handleImport}
          isImporting={importMutation.isPending}
          permissionKey={SYNEY_MATERIALS_INVENTORY_PERMISSION_KEY}
        />
      </div>

      <SyneyMaterialsSearch
        values={filters}
        onSearch={handleSearch}
        onReset={() => handleSearch(undefined)}
      />

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <TableState loading={isLoading && !data} error={error} onRetry={refetch}>
            <SyneyMaterialsInventoryTable
              loading={isLoading}
              data={data?.items || []}
              selectedRowKeys={selectedRowKeys}
              onSelect={setSelectedRowKeys}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
              rowHeight={rowHeight}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={data?.total || 0} />
        </div>
      </div>

      <Modal
        title="编辑材料库存"
        open={editingRecord !== null}
        destroyOnHidden
        confirmLoading={updateMutation.isPending}
        okButtonProps={{ disabled: viewerDenied || !canManage }}
        onOk={() => formRef?.submit()}
        onCancel={closeModal}
      >
        {editingRecord
          ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {formatSyneyMaterialLabel(editingRecord)}
                </div>
                <FormErrorAlert error={formError} />
                <JintanInventoryAdjustForm
                  currentQuantity={editingRecord.quantity}
                  initialRemarks={editingRecord.remarks}
                  onFinish={handleFinish}
                  setFormRef={setFormRef}
                  isSubmitting={updateMutation.isPending}
                />
              </div>
            )
          : null}
      </Modal>
    </div>
  )
}
