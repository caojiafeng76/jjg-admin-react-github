import { useState, useCallback, useEffect } from 'react'
import { App, Modal, FormInstance, Drawer } from 'antd'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

import AddButton from '@/ui/AddButton'
import EditButton from '@/ui/EditButton'
import DeleteButton from '@/ui/DeleteButton'
import ExportButton from '@/ui/ExportButton'
import AppPagination from '@/ui/AppPagination'
import { useTableHeight } from '@/hooks/useTableHeight'
import {
  useProductionSheetsList,
  useCreateProductionSheet,
  useUpdateProductionSheet,
  useDeleteProductionSheets,
  useProductionSheetById,
} from './useProductionSheets'
import ProductionSheetTable from './ProductionSheetTable'
import ProductionSheetForm from './ProductionSheetForm'
import ProductionSheetSearch from './ProductionSheetSearch'
import ProductionRecordTable from './ProductionRecordTable'
import { useExportProductionSheetsAsExcel } from './useExportProductionSheetsAsExcel'

export default function ProductionRecordList() {
  const { message } = App.useApp()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('录入产量单')
  const [isEdit, setIsEdit] = useState(false)
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [searchParamsURL, setSearchParamsURL] = useSearchParams()
  const page = Number(searchParamsURL.get('page')) || 1
  const pageSize = Number(searchParamsURL.get('pageSize')) || 10
  const [formRef, setFormRef] = useState<FormInstance<any> | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null)

  // 初始化当月日期范围
  const getCurrentMonthRange = () => {
    const start = dayjs().startOf('month')
    const end = dayjs().endOf('month')
    return {
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
    }
  }

  const [searchParams, setSearchParams] = useState<{
    startDate?: string
    endDate?: string
  }>(() => {
    // 初始化时设置为当月日期范围
    const monthRange = getCurrentMonthRange()
    return {
      startDate: monthRange.startDate,
      endDate: monthRange.endDate,
    }
  })

  const { data, isLoading } = useProductionSheetsList({
    page,
    pageSize,
    searchParams,
  })

  const createMutation = useCreateProductionSheet()
  const updateMutation = useUpdateProductionSheet()
  const deleteMutation = useDeleteProductionSheets()
  const { exportProductionSheetsAsExcel, isExporting } =
    useExportProductionSheetsAsExcel(message)

  const { data: sheetDetail, isLoading: detailLoading } =
    useProductionSheetById(selectedSheetId)
  const { data: editingSheetDetail } = useProductionSheetById(editingSheetId)

  // 动态计算表格高度（目标10条数据撑满，需要减去汇总行高度）
  const { tableContainerRef, paginationRef, scrollY, rowHeight } =
    useTableHeight({
      targetRowCount: 10,
      headerHeight: 39,
      summaryRowHeight: 40, // 汇总行高度，与普通行高相同
    })

  const handleCreate = useCallback(() => {
    setIsEdit(false)
    setEditingSheetId(null)
    setModalTitle('录入产量单')
    setIsModalOpen(true)
    formRef?.resetFields()
  }, [formRef])

  const handleEdit = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      message.warning('请选择一条数据进行编辑')
      return
    }
    const sheetId = selectedRowKeys[0] as string
    setEditingSheetId(sheetId)
    setIsEdit(true)
    setModalTitle('编辑产量单')
    setIsModalOpen(true)
  }, [message, selectedRowKeys])

  const handleDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条数据')
      return
    }
    deleteMutation.mutate(selectedRowKeys as string[], {
      onSuccess: () => {
        message.success('删除成功')
        setSelectedRowKeys([])
      },
    })
  }, [deleteMutation, message, selectedRowKeys])

  const handleFinish = useCallback(
    (values: {
      production_date: string
      operator_ids: string[]
      working_hours?: number | null
      remark?: string | null
      records: any[]
    }) => {
      if (values.records.length === 0) {
        message.warning('至少需要添加一条产量记录')
        return
      }
      if (!values.operator_ids || values.operator_ids.length === 0) {
        message.warning('请至少选择一个操作者')
        return
      }

      if (isEdit && editingSheetId) {
        updateMutation.mutate(
          {
            id: editingSheetId,
            ...values,
          },
          {
            onSuccess: () => {
              message.success('更新产量单成功')
              setIsModalOpen(false)
              setIsEdit(false)
              setEditingSheetId(null)
              setSelectedRowKeys([])
            },
          },
        )
      } else {
        createMutation.mutate(values, {
          onSuccess: () => {
            message.success('创建产量单成功')
            setIsModalOpen(false)
            setSelectedRowKeys([])
          },
        })
      }
    },
    [createMutation, updateMutation, isEdit, editingSheetId, message],
  )

  const handleExport = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择至少一条产量单导出')
      return
    }
    exportProductionSheetsAsExcel(selectedRowKeys as string[])
  }, [exportProductionSheetsAsExcel, message, selectedRowKeys])

  const handleViewDetail = useCallback((sheetId: string) => {
    setSelectedSheetId(sheetId)
    setDetailDrawerOpen(true)
  }, [])

  const handleSearch = useCallback(
    (params: typeof searchParams) => {
      setSearchParams(params)
      searchParamsURL.set('page', '1')
      setSearchParamsURL(searchParamsURL)
    },
    [searchParamsURL, setSearchParamsURL],
  )

  const handleResetSearch = useCallback(() => {
    setSearchParams({})
    searchParamsURL.set('page', '1')
    setSearchParamsURL(searchParamsURL)
  }, [searchParamsURL, setSearchParamsURL])

  useEffect(() => {
    if (page > 1 && data && data.items.length === 0) {
      searchParamsURL.set('page', Math.max(page - 1, 1).toString())
      setSearchParamsURL(searchParamsURL)
    }
  }, [data, page, searchParamsURL, setSearchParamsURL])

  // 初始化时自动应用当月日期范围（仅在首次加载时执行）
  useEffect(() => {
    // 检查URL参数中是否已有日期范围，如果没有则使用当月
    const urlStartDate = searchParamsURL.get('startDate')
    const urlEndDate = searchParamsURL.get('endDate')

    // 如果URL中没有日期参数，且当前searchParams也没有日期，则使用当月日期范围
    if (
      !urlStartDate &&
      !urlEndDate &&
      !searchParams.startDate &&
      !searchParams.endDate
    ) {
      // URL中没有日期参数，使用当月日期范围
      const monthRange = getCurrentMonthRange()
      setSearchParams({
        startDate: monthRange.startDate,
        endDate: monthRange.endDate,
      })
    }
  }, []) // 仅在组件首次加载时执行

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton handleCreate={handleCreate} />
        <EditButton title="编辑" handleEdit={handleEdit} />
        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={deleteMutation.isPending}
          count={selectedRowKeys.length}
          title="删除产量单"
          itemName="产量单"
        />
        <ExportButton
          handleExport={handleExport}
          loading={isExporting}
          count={selectedRowKeys.length}
        />
      </div>

      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-gray-600">搜索：</span>
        <ProductionSheetSearch
          onSearch={handleSearch}
          onReset={handleResetSearch}
          initialStartDate={searchParams.startDate}
          initialEndDate={searchParams.endDate}
        />
      </div>

      {/* 表格和分页 */}
      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-x-auto">
          <ProductionSheetTable
            loading={isLoading}
            data={data?.items || []}
            selectedRowKeys={selectedRowKeys}
            onSelect={setSelectedRowKeys}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
            rowHeight={rowHeight}
            onViewDetail={handleViewDetail}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination
            total={data?.total || 0}
            pageSizeOptions={[
              '10',
              '20',
              '30',
              '50',
              '100',
              '200',
              '300',
              '500',
            ]}
            defaultPageSize={10}
          />
        </div>
      </div>

      {/* 创建/编辑产量单弹窗 */}
      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        onOk={async () => {
          try {
            await formRef?.validateFields()
            formRef?.submit()
          } catch (error) {
            console.error('表单验证失败:', error)
            // 验证失败时，Ant Design 会自动显示错误信息
          }
        }}
        onCancel={() => {
          setIsModalOpen(false)
          setIsEdit(false)
          setEditingSheetId(null)
          formRef?.resetFields()
        }}
        width={1000}
        style={{ top: 20 }}
      >
        <ProductionSheetForm
          onFinish={handleFinish}
          setFormRef={setFormRef}
          isCreating={createMutation.isPending || updateMutation.isPending}
          initialValues={
            isEdit && editingSheetDetail
              ? {
                  production_date: editingSheetDetail.production_date,
                  operator_ids:
                    editingSheetDetail.records?.[0]?.operator_ids || [],
                  working_hours:
                    editingSheetDetail.working_hours || null,
                  remark: editingSheetDetail.remark || null,
                  records: editingSheetDetail.records || [],
                }
              : undefined
          }
        />
      </Modal>

      {/* 产量单详情抽屉 */}
      <Drawer
        title={`产量单详情 - ${sheetDetail?.production_date ? dayjs(sheetDetail.production_date).format('YYYY-MM-DD') : ''}`}
        placement="right"
        size="large"
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false)
          setSelectedSheetId(null)
        }}
      >
        {detailLoading ? (
          <div>加载中...</div>
        ) : sheetDetail?.records && sheetDetail.records.length > 0 ? (
          <ProductionRecordTable
            loading={false}
            data={sheetDetail.records}
            selectedRowKeys={[]}
            onSelect={() => {}}
            page={1}
            pageSize={sheetDetail.records.length}
            scrollY={600}
            rowHeight={40}
          />
        ) : (
          <div>暂无记录</div>
        )}
      </Drawer>
    </div>
  )
}
