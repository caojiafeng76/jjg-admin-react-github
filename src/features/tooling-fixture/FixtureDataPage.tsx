import { useCallback, useState } from 'react'
import { App } from 'antd'
import type { FormInstance } from 'antd'
import type { Dayjs } from 'dayjs'

import { useTableHeight } from '@/hooks/useTableHeight'
import {
  getAllToolingFixtures,
  type ToolingFixture,
  type ToolingFixtureDateRange,
  type ToolingFixtureFormValues,
} from '@/services/apiToolingFixture'
import {
  useCreateToolingFixture,
  useDeleteToolingFixtures,
  useImportToolingFixtures,
  useToolingFixtureList,
  useUpdateToolingFixture,
} from './useToolingFixtures'
import FixtureDataView from './FixtureDataView'
import { usePrintToolingFixtureQrLabels } from './usePrintToolingFixtureQrLabels'

const DEFAULT_PAGE_SIZE = 10

function toFixtureDateRange(
  range: [Dayjs, Dayjs] | null,
): ToolingFixtureDateRange | undefined {
  return range
    ? {
        start: range[0].format('YYYY-MM-DD'),
        end: range[1].format('YYYY-MM-DD'),
      }
    : undefined
}

export default function FixtureDataPage() {
  const { message, modal } = App.useApp()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<ToolingFixture['status']>()
  const [manufacturedDateRange, setManufacturedDateRange] = useState<
    [Dayjs, Dayjs] | null
  >(null)
  const [updatedDateRange, setUpdatedDateRange] = useState<
    [Dayjs, Dayjs] | null
  >(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] = useState<ToolingFixture | null>(
    null,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [formRef, setFormRef] =
    useState<FormInstance<ToolingFixtureFormValues> | null>(null)
  const [formError, setFormError] = useState<unknown>(null)

  const { data, isLoading, error, refetch } = useToolingFixtureList({
    page,
    pageSize,
    keyword,
    status,
    manufacturedDateRange: toFixtureDateRange(manufacturedDateRange),
    updatedDateRange: toFixtureDateRange(updatedDateRange),
  })
  const createMutation = useCreateToolingFixture()
  const updateMutation = useUpdateToolingFixture()
  const importMutation = useImportToolingFixtures()
  const deleteMutation = useDeleteToolingFixtures()
  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: DEFAULT_PAGE_SIZE,
  })
  const { printLabels, isPrinting } = usePrintToolingFixtureQrLabels()
  const [isPrintLoading, setIsPrintLoading] = useState(false)
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingRecord(null)
    setFormError(null)
    formRef?.resetFields()
  }, [formRef])

  const handleFinish = useCallback(
    async (values: ToolingFixtureFormValues) => {
      try {
        if (editingRecord) {
          await updateMutation.mutateAsync({ id: editingRecord.id, values })
          message.success('工装资料更新成功')
        } else {
          await createMutation.mutateAsync(values)
          message.success('工装资料创建成功')
        }
        closeModal()
        setSelectedRowKeys([])
      } catch (error) {
        setFormError(
          error instanceof Error ? error : new Error('保存工装资料失败'),
        )
      }
    },
    [closeModal, createMutation, editingRecord, message, updateMutation],
  )

  const handleDelete = useCallback(
    (record: ToolingFixture) => {
      modal.confirm({
        title: '确认删除工装资料？',
        content: `删除后将无法删除关联的出入记录，当前编号：${record.fixture_no}`,
        okText: '删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteMutation.mutateAsync([record.id])
            message.success('工装资料删除成功')
            setSelectedRowKeys([])
          } catch (error) {
            message.error(
              error instanceof Error ? error.message : '删除工装资料失败',
            )
          }
        },
      })
    },
    [deleteMutation, message, modal],
  )

  const handleDeleteSelected = useCallback(() => {
    const ids = selectedRowKeys.map(String)

    modal.confirm({
      title: '确认删除选中的工装资料？',
      content: '如果工装已经产生出入记录，删除操作会被数据库拒绝。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteMutation.mutateAsync(ids)
          message.success('工装资料删除成功')
          setSelectedRowKeys([])
        } catch (error) {
          message.error(
            error instanceof Error ? error.message : '删除工装资料失败',
          )
        }
      },
    })
  }, [deleteMutation, message, modal, selectedRowKeys])

  const openCreate = useCallback(() => {
    setEditingRecord(null)
    setFormError(null)
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((record: ToolingFixture) => {
    setEditingRecord(record)
    setFormError(null)
    setModalOpen(true)
  }, [])

  const handleSearch = useCallback((value: string) => {
    setPage(1)
    setKeyword(value.trim())
  }, [])

  const handleImport = useCallback(
    async (rows: ToolingFixtureFormValues[]) => {
      try {
        await importMutation.mutateAsync(rows)
        message.success(`工装资料导入成功，共 ${rows.length} 条`)
        setSelectedRowKeys([])
      } catch (error) {
        message.error(
          error instanceof Error ? error.message : '导入工装资料失败',
        )
        throw error
      }
    },
    [importMutation, message],
  )

  const handlePrintFiltered = useCallback(async () => {
    try {
      setIsPrintLoading(true)
      const items = await getAllToolingFixtures({
        keyword: keyword || undefined,
        status,
        manufacturedDateRange: toFixtureDateRange(manufacturedDateRange),
        updatedDateRange: toFixtureDateRange(updatedDateRange),
      })

      if (items.length === 0) {
        message.warning('当前筛选条件下没有可打印的工装')
        return
      }

      await printLabels(items)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取工装资料失败')
    } finally {
      setIsPrintLoading(false)
    }
  }, [
    keyword,
    manufacturedDateRange,
    message,
    printLabels,
    status,
    updatedDateRange,
  ])

  const handlePrintRecord = useCallback(
    (record: ToolingFixture) => {
      void printLabels([record])
    },
    [printLabels],
  )

  return (
    <FixtureDataView
      data={data}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
      keyword={keyword}
      status={status}
      manufacturedDateRange={manufacturedDateRange}
      updatedDateRange={updatedDateRange}
      selectedRowKeys={selectedRowKeys}
      page={page}
      pageSize={pageSize}
      editingRecord={editingRecord}
      modalOpen={modalOpen}
      formError={formError}
      isSubmitting={isSubmitting}
      isImporting={importMutation.isPending}
      isPrinting={isPrinting}
      isPrintLoading={isPrintLoading}
      tableContainerRef={tableContainerRef}
      paginationRef={paginationRef}
      scrollY={scrollY}
      onCreate={openCreate}
      onImport={handleImport}
      onSearch={handleSearch}
      onStatusChange={(value) => {
        setPage(1)
        setStatus(value)
      }}
      onManufacturedDateChange={(value) => {
        setPage(1)
        setManufacturedDateRange(value)
      }}
      onUpdatedDateChange={(value) => {
        setPage(1)
        setUpdatedDateRange(value)
      }}
      onPrintFiltered={handlePrintFiltered}
      onDeleteSelected={handleDeleteSelected}
      onSelect={setSelectedRowKeys}
      onEdit={openEdit}
      onDelete={handleDelete}
      onPrint={handlePrintRecord}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size)
        setPage(1)
      }}
      onClose={closeModal}
      onSubmit={() => formRef?.submit()}
      onFinish={handleFinish}
      onSetFormRef={setFormRef}
    />
  )
}
