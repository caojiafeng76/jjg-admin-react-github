import type { FormInstance, TableColumnsType } from 'antd'
import type {
  WorkshopMiscMaterialsInventory,
  WorkshopMiscMaterialsInventoryFormValues,
  WorkshopMiscMaterialsInventoryImportRow,
} from '@/services/apiWorkshopMiscMaterialsInventory'
import type { WorkshopMiscMaterialsSearchFilters } from '@/services/workshopMiscMaterialsSearchFields'
import { App, Modal } from 'antd'
import { useCallback, useEffect, useState } from 'react'

import { usePermission } from '@/hooks/usePermission'
import { useTableHeight } from '@/hooks/useTableHeight'
import { useViewerOperationGuard } from '@/hooks/useViewerOperationGuard'
import { getWorkshopMiscMaterialsInventoryForExport } from '@/services/apiWorkshopMiscMaterialsInventory'
import AppPagination from '@/ui/AppPagination'
import EditButton from '@/ui/EditButton'
import ExcelImportModal from '@/ui/ExcelImportModal'
import ExportButton from '@/ui/ExportButton'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { formatQuantity, formatWorkshopMiscMaterialLabel } from '../display'
import {
  loadWorkshopMiscMaterialsExcel,
  preloadWorkshopMiscMaterialsExcel,
} from '../loadWorkshopMiscMaterialsExcel'
import { WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY } from '../permissions'
import { useWorkshopMiscMaterialsListParams } from '../useWorkshopMiscMaterialsListParams'
import WorkshopMiscMaterialsInventoryAdjustForm from '../WorkshopMiscMaterialsInventoryAdjustForm'
import WorkshopMiscMaterialsSearch from '../WorkshopMiscMaterialsSearch'
import {
  useImportWorkshopMiscMaterialsInventory,
  useUpdateWorkshopMiscMaterialsInventory,
  useWorkshopMiscMaterialsInventoryList,
} from './useWorkshopMiscMaterialsInventory'
import WorkshopMiscMaterialsInventoryTable from './WorkshopMiscMaterialsInventoryTable'

const ENTITY = '材料库存'

const IMPORT_COLUMNS: TableColumnsType<
  WorkshopMiscMaterialsInventoryImportRow & { _idx: number }
> = [
  { title: '#', dataIndex: '_idx', width: 60, render: (value: number) => value + 1 },
  { title: '型号', dataIndex: 'model', width: 140 },
  { title: '客户型号', dataIndex: 'customer_model', width: 140 },
  { title: '规格', dataIndex: 'specification', width: 140 },
  { title: '类别', dataIndex: 'category', width: 100 },
  {
    title: '原材料数量',
    dataIndex: 'raw_material_quantity',
    width: 100,
    align: 'right',
    render: (value: number) => formatQuantity(value),
  },
  {
    title: '半成品数量',
    dataIndex: 'semi_finished_quantity',
    width: 100,
    align: 'right',
    render: (value: number) => formatQuantity(value),
  },
  {
    title: '成品数量',
    dataIndex: 'finished_quantity',
    width: 90,
    align: 'right',
    render: (value: number) => formatQuantity(value),
  },
  {
    title: '合计',
    key: 'total',
    width: 90,
    align: 'right',
    render: (_value, row) =>
      formatQuantity(
        row.raw_material_quantity
        + row.semi_finished_quantity
        + row.finished_quantity,
      ),
  },
  { title: '备注', dataIndex: 'remarks' },
]

export default function WorkshopMiscMaterialsInventoryPage() {
  const { message } = App.useApp()
  const canManage = usePermission(WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY)
  const { viewerDenied, viewerOperationTip } = useViewerOperationGuard()
  const { page, pageSize, filters, setFilters, stepBackIfEmpty }
    = useWorkshopMiscMaterialsListParams()

  const [editingRecord, setEditingRecord]
    = useState<WorkshopMiscMaterialsInventory | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [formRef, setFormRef]
    = useState<FormInstance<WorkshopMiscMaterialsInventoryFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)

  const { data, isLoading, error, refetch } = useWorkshopMiscMaterialsInventoryList({
    page,
    pageSize,
    filters,
  })
  const updateMutation = useUpdateWorkshopMiscMaterialsInventory()
  const importMutation = useImportWorkshopMiscMaterialsInventory()

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
    async (values: WorkshopMiscMaterialsInventoryFormValues) => {
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
    async (rows: WorkshopMiscMaterialsInventoryImportRow[]) => {
      if (viewerDenied) {
        throw new Error(viewerOperationTip)
      }
      if (!canManage) {
        throw new Error('无材料库存操作权限')
      }
      await importMutation.mutateAsync(rows)
      message.success(feedbackText.imported(ENTITY, rows.length))
      setSelectedRowKeys([])
    },
    [canManage, importMutation, message, viewerDenied, viewerOperationTip],
  )

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const [rows, { exportWorkshopMiscMaterialsInventoryToExcel }]
        = await Promise.all([
          getWorkshopMiscMaterialsInventoryForExport(filters),
          loadWorkshopMiscMaterialsExcel(),
        ])
      if (rows.length === 0) {
        message.warning('当前没有可导出的材料库存')
        return
      }
      exportWorkshopMiscMaterialsInventoryToExcel(rows)
      message.success(feedbackText.exported(ENTITY, rows.length))
    }
    catch (exportError) {
      message.error(
        getUserErrorMessage(exportError, feedbackText.failed('导出', ENTITY)),
      )
    }
    finally {
      setIsExporting(false)
    }
  }, [filters, message])

  const handleSearch = useCallback(
    (next?: WorkshopMiscMaterialsSearchFilters) => {
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
          permissionKey={WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY}
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          permissionKey={WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY}
          onPreload={preloadWorkshopMiscMaterialsExcel}
        >
          导出 Excel
        </ExportButton>
        <ExcelImportModal<WorkshopMiscMaterialsInventoryImportRow>
          title="批量导入材料库存"
          tip="按「型号 + 客户型号 + 规格 + 类别」匹配已有材料资料并覆盖三项数量与备注；资料不存在的行会导致整批导入失败；数量差额会记入调整记录。"
          columns={IMPORT_COLUMNS}
          parseFile={async (file) => {
            const excel = await loadWorkshopMiscMaterialsExcel()
            return excel.parseWorkshopMiscMaterialsInventoryExcel(file)
          }}
          onDownloadTemplate={async () => {
            const excel = await loadWorkshopMiscMaterialsExcel()
            excel.downloadWorkshopMiscMaterialsInventoryTemplate()
          }}
          onPreload={preloadWorkshopMiscMaterialsExcel}
          onImport={handleImport}
          isImporting={importMutation.isPending}
          permissionKey={WORKSHOP_MISC_MATERIALS_INVENTORY_PERMISSION_KEY}
        />
      </div>

      <WorkshopMiscMaterialsSearch
        values={filters}
        onSearch={handleSearch}
        onReset={() => handleSearch(undefined)}
      />

      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-hidden">
          <TableState loading={isLoading && !data} error={error} onRetry={refetch}>
            <WorkshopMiscMaterialsInventoryTable
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
        width={720}
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
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formatWorkshopMiscMaterialLabel(editingRecord)}
                </div>
                <FormErrorAlert error={formError} />
                <WorkshopMiscMaterialsInventoryAdjustForm
                  currentRaw={editingRecord.raw_material_quantity}
                  currentSemi={editingRecord.semi_finished_quantity}
                  currentFinished={editingRecord.finished_quantity}
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
