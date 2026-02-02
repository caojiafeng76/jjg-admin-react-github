import { useState, useCallback, useEffect } from 'react'
import {
  App,
  Modal,
  FormInstance,
  Spin,
  Card,
  Checkbox,
  Table,
  Button,
} from 'antd'
import { useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'

/* eslint-disable @typescript-eslint/no-explicit-any */

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
// Table view replaced by card grid in this component
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
  const pageSize = Number(searchParamsURL.get('pageSize')) || 6
  const [formRef, setFormRef] = useState<FormInstance<any> | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
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
  const { data: editingSheetDetail, isLoading: editingDetailLoading } =
    useProductionSheetById(editingSheetId)

  // 动态计算表格高度（目标10条数据撑满，需要减去汇总行高度）
  const { tableContainerRef, paginationRef } = useTableHeight({
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
    // 仅在组件首次加载时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-8">
              <Spin />
            </div>
          ) : data?.items && data.items.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((sheet) => {
                const isSelected = selectedRowKeys.includes(sheet.id!)
                const cardColumns = [
                  {
                    title: '#',
                    width: 40,
                    render: (_: any, __: any, idx: number) => idx + 1,
                  },
                  {
                    title: '项目号',
                    dataIndex: ['order', 'project_no'],
                    ellipsis: true,
                    render: (val: string, rec: any) =>
                      val || rec.order_id || '-',
                  },
                  {
                    title: '型号',
                    dataIndex: ['order', 'product_model'],
                    ellipsis: true,
                    render: (val: string) => val || '-',
                  },
                  {
                    title: '工序',
                    dataIndex: ['process', 'process_name'],
                    ellipsis: true,
                    render: (val: string, rec: any) =>
                      val || rec.process_id || '-',
                  },
                  {
                    title: '数量',
                    dataIndex: 'qualified_quantity',
                    width: 60,
                    render: (val: number) => val ?? 0,
                  },
                ]
                return (
                  <Card
                    key={sheet.id}
                    size="small"
                    hoverable
                    className={isSelected ? 'ring-2 ring-blue-400' : ''}
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-base font-medium">
                          {sheet.production_date
                            ? dayjs(sheet.production_date).format('M月D日')
                            : '-'}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-normal text-gray-500">
                            {sheet.operators && sheet.operators.length > 0
                              ? sheet.operators[0].name
                              : '-'}
                          </span>
                          <span className="text-sm font-normal text-gray-500">
                            工时: {sheet.working_hours ?? '-'}
                          </span>
                        </div>
                      </div>
                    }
                    extra={
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRowKeys([...selectedRowKeys, sheet.id!])
                          } else {
                            setSelectedRowKeys(
                              selectedRowKeys.filter((k) => k !== sheet.id!),
                            )
                          }
                        }}
                      />
                    }
                    actions={[
                      <Button
                        key="detail"
                        type="link"
                        size="small"
                        onClick={() => {
                          setSelectedSheetId(sheet.id || null)
                          setDetailModalOpen(true)
                        }}
                      >
                        详情
                      </Button>,
                      <span key="time" className="text-xs text-gray-400">
                        {sheet.created_at
                          ? new Date(sheet.created_at).toLocaleString('zh-CN')
                          : ''}
                      </span>,
                    ]}
                  >
                    <Table
                      size="small"
                      dataSource={sheet.records || []}
                      columns={cardColumns}
                      rowKey={(r) => r.id || Math.random().toString()}
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                    />
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="p-4 text-gray-500">暂无数据</div>
          )}
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination
            total={data?.total || 0}
            pageSizeOptions={['6', '12', '18', '30', '60', '120']}
            defaultPageSize={6}
          />
        </div>
      </div>

      {/* 创建/编辑产量单弹窗 */}
      <Modal
        title={modalTitle}
        open={isModalOpen}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        okButtonProps={{
          disabled: isEdit && editingDetailLoading,
        }}
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
        <Spin
          spinning={isEdit && editingDetailLoading}
          tip="正在加载产量单数据..."
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
                    working_hours: editingSheetDetail.working_hours || null,
                    remark: editingSheetDetail.remark || null,
                    records: editingSheetDetail.records || [],
                  }
                : undefined
            }
          />
        </Spin>
      </Modal>

      {/* 产量单详情模态框 */}
      <Modal
        title={`产量单详情 - ${sheetDetail?.production_date ? dayjs(sheetDetail.production_date).format('YYYY-MM-DD') : ''}`}
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false)
          setSelectedSheetId(null)
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spin tip="加载中..." />
          </div>
        ) : sheetDetail?.records && sheetDetail.records.length > 0 ? (
          <ProductionRecordTable
            loading={false}
            data={sheetDetail.records}
            selectedRowKeys={[]}
            onSelect={() => {}}
            page={1}
            pageSize={sheetDetail.records.length}
            scrollY={400}
            rowHeight={40}
          />
        ) : (
          <div className="py-8 text-center text-gray-500">暂无记录</div>
        )}
      </Modal>
    </div>
  )
}
