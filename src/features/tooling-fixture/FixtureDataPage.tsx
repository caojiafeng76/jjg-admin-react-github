import { useCallback, useState } from 'react'
import { PlusIcon } from '@heroicons/react/16/solid'
import {
  App,
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Typography,
} from 'antd'
import type { FormInstance } from 'antd'

import type {
  ToolingFixture,
  ToolingFixtureFormValues,
} from '@/services/apiToolingFixture'
import PrintButton from '@ui/PrintButton'
import {
  useCreateToolingFixture,
  useDeleteToolingFixtures,
  useToolingFixtureList,
  useUpdateToolingFixture,
} from './useToolingFixtures'
import ToolingFixtureForm from './ToolingFixtureForm'
import ToolingFixtureTable from './ToolingFixtureTable'
import { usePrintToolingFixtureQrLabels } from './usePrintToolingFixtureQrLabels'

const DEFAULT_PAGE_SIZE = 10

export default function FixtureDataPage() {
  const { message, modal } = App.useApp()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<ToolingFixture['status']>()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [editingRecord, setEditingRecord] = useState<ToolingFixture | null>(
    null,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [formRef, setFormRef] =
    useState<FormInstance<ToolingFixtureFormValues> | null>(null)

  const { data, isLoading } = useToolingFixtureList({
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    keyword,
    status,
  })
  const createMutation = useCreateToolingFixture()
  const updateMutation = useUpdateToolingFixture()
  const deleteMutation = useDeleteToolingFixtures()
  const { printLabels, isPrinting } = usePrintToolingFixtureQrLabels()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingRecord(null)
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
        message.error(
          error instanceof Error ? error.message : '保存工装资料失败',
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
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((record: ToolingFixture) => {
    setEditingRecord(record)
    setModalOpen(true)
  }, [])

  const handleSearch = useCallback((value: string) => {
    setPage(1)
    setKeyword(value.trim())
  }, [])

  const handlePrintSelected = useCallback(() => {
    const records = (data?.items ?? []).filter((item) =>
      selectedRowKeys.includes(item.id),
    )
    void printLabels(records)
  }, [data?.items, printLabels, selectedRowKeys])

  const handlePrintRecord = useCallback(
    (record: ToolingFixture) => {
      void printLabels([record])
    },
    [printLabels],
  )

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography.Title level={2} className="!mb-1">
            工装资料
          </Typography.Title>
          <Typography.Text type="secondary">
            维护工装模具资料，并为每个工装生成现场扫码二维码。
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusIcon className="size-4" />}
          onClick={openCreate}
        >
          新增工装
        </Button>
      </div>

      <Card>
        <Space wrap className="mb-4">
          <Input.Search
            allowClear
            placeholder="搜索编号、产品、设备、责任人"
            onSearch={handleSearch}
            style={{ width: 320, maxWidth: '85vw' }}
          />
          <Select
            allowClear
            placeholder="按状态筛选"
            value={status}
            style={{ width: 140 }}
            options={[
              { label: '未使用', value: '未使用' },
              { label: '使用中', value: '使用中' },
            ]}
            onChange={(value: ToolingFixture['status'] | undefined) => {
              setPage(1)
              setStatus(value)
            }}
          />
          {selectedRowKeys.length > 0 ? (
            <>
              <PrintButton
                handlePrint={handlePrintSelected}
                loading={isPrinting}
                count={selectedRowKeys.length}
              >
                打印二维码
              </PrintButton>
              <Button danger onClick={handleDeleteSelected}>
                删除选中
              </Button>
            </>
          ) : null}
        </Space>

        <ToolingFixtureTable
          loading={isLoading}
          data={data?.items ?? []}
          selectedRowKeys={selectedRowKeys}
          onSelect={setSelectedRowKeys}
          onEdit={openEdit}
          onDelete={handleDelete}
          onPrint={handlePrintRecord}
          page={page}
          pageSize={DEFAULT_PAGE_SIZE}
        />

        <div className="mt-4 flex justify-end">
          <Pagination
            current={page}
            pageSize={DEFAULT_PAGE_SIZE}
            total={data?.total ?? 0}
            showSizeChanger={false}
            onChange={(nextPage) => setPage(nextPage)}
          />
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title={editingRecord ? '编辑工装资料' : '新增工装资料'}
        width={860}
        destroyOnHidden
        onCancel={closeModal}
        onOk={() => formRef?.submit()}
        okText="保存"
        cancelText="取消"
        confirmLoading={isSubmitting}
      >
        <ToolingFixtureForm
          setFormRef={setFormRef}
          onFinish={handleFinish}
          isSubmitting={isSubmitting}
          initialValues={editingRecord ?? undefined}
          status={editingRecord?.status ?? '未使用'}
        />
      </Modal>
    </div>
  )
}
