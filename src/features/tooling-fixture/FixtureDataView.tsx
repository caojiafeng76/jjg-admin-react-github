import {
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Typography,
} from 'antd'
import type { FormInstance } from 'antd'
import type { Dayjs } from 'dayjs'

import { PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import type {
  ToolingFixture,
  ToolingFixtureFormValues,
} from '@/services/apiToolingFixture'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import PrintButton from '@ui/PrintButton'
import ToolingFixtureExcelImport from './ToolingFixtureExcelImport'
import ToolingFixtureForm from './ToolingFixtureForm'
import ToolingFixtureTable from './ToolingFixtureTable'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

interface FixtureDataViewProps {
  data: { items: ToolingFixture[]; total: number } | undefined
  isLoading: boolean
  error: unknown
  refetch: () => void
  keyword: string
  status: ToolingFixture['status'] | undefined
  manufacturedDateRange: [Dayjs, Dayjs] | null
  updatedDateRange: [Dayjs, Dayjs] | null
  selectedRowKeys: React.Key[]
  page: number
  pageSize: number
  editingRecord: ToolingFixture | null
  modalOpen: boolean
  formError: unknown
  isSubmitting: boolean
  isImporting: boolean
  isPrinting: boolean
  isPrintLoading: boolean
  tableContainerRef: React.RefObject<HTMLDivElement | null>
  paginationRef: React.RefObject<HTMLDivElement | null>
  scrollY: number
  onCreate: () => void
  onImport: (rows: ToolingFixtureFormValues[]) => Promise<void>
  onSearch: (value: string) => void
  onStatusChange: (value: ToolingFixture['status'] | undefined) => void
  onManufacturedDateChange: (value: [Dayjs, Dayjs] | null) => void
  onUpdatedDateChange: (value: [Dayjs, Dayjs] | null) => void
  onPrintFiltered: () => Promise<void>
  onDeleteSelected: () => void
  onSelect: (keys: React.Key[]) => void
  onEdit: (record: ToolingFixture) => void
  onDelete: (record: ToolingFixture) => void
  onPrint: (record: ToolingFixture) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onClose: () => void
  onSubmit: () => void
  onFinish: (values: ToolingFixtureFormValues) => Promise<void>
  onSetFormRef: (form: FormInstance<ToolingFixtureFormValues>) => void
}

export default function FixtureDataView({
  data,
  isLoading,
  error,
  refetch,
  keyword,
  status,
  manufacturedDateRange,
  updatedDateRange,
  selectedRowKeys,
  page,
  pageSize,
  editingRecord,
  modalOpen,
  formError,
  isSubmitting,
  isImporting,
  isPrinting,
  isPrintLoading,
  tableContainerRef,
  paginationRef,
  scrollY,
  onCreate,
  onImport,
  onSearch,
  onStatusChange,
  onManufacturedDateChange,
  onUpdatedDateChange,
  onPrintFiltered,
  onDeleteSelected,
  onSelect,
  onEdit,
  onDelete,
  onPrint,
  onPageChange,
  onPageSizeChange,
  onClose,
  onSubmit,
  onFinish,
  onSetFormRef,
}: FixtureDataViewProps) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography.Title level={2} className="!mb-1">
            工装资料
          </Typography.Title>
          <Typography.Text type="secondary">
            维护工装模具资料，并为每个工装生成现场扫码二维码。
          </Typography.Text>
        </div>
        <div className="flex items-center gap-2">
          <ToolingFixtureExcelImport
            onImport={onImport}
            isImporting={isImporting}
          />
          <Button
            type="primary"
            icon={<PlusIcon className="size-4" />}
            onClick={onCreate}
          >
            新增工装
          </Button>
        </div>
      </div>

      <Card
        className="flex min-h-0 flex-1 flex-col overflow-hidden shadow-sm"
        styles={{
          body: {
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Space wrap className="mb-4">
          <Input.Search
            allowClear
            placeholder="搜索编号、产品、设备、责任人"
            defaultValue={keyword}
            onSearch={onSearch}
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
            onChange={onStatusChange}
          />
          <DatePicker.RangePicker
            allowClear
            format="YYYY-MM-DD"
            placeholder={['制作开始日期', '制作结束日期']}
            value={manufacturedDateRange}
            style={{ width: 260 }}
            onChange={(value) =>
              onManufacturedDateChange(
                value?.[0] && value?.[1] ? [value[0], value[1]] : null,
              )
            }
          />
          <DatePicker.RangePicker
            allowClear
            format="YYYY-MM-DD"
            placeholder={['更新开始日期', '更新结束日期']}
            value={updatedDateRange}
            style={{ width: 260 }}
            onChange={(value) =>
              onUpdatedDateChange(
                value?.[0] && value?.[1] ? [value[0], value[1]] : null,
              )
            }
          />
          <PrintButton
            handlePrint={onPrintFiltered}
            loading={isPrinting || isPrintLoading}
          >
            打印二维码
          </PrintButton>
          {selectedRowKeys.length > 0 ? (
            <Button
              type="text"
              danger
              icon={<TrashIcon className="size-4" />}
              onClick={onDeleteSelected}
            >
              删除选中
            </Button>
          ) : null}
        </Space>

        <div
          ref={tableContainerRef}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-x-auto">
            <TableState
              loading={isLoading && !data}
              error={error}
              onRetry={refetch}
            >
              <ToolingFixtureTable
                loading={isLoading}
                data={data?.items ?? []}
                selectedRowKeys={selectedRowKeys}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onPrint={onPrint}
                page={page}
                pageSize={pageSize}
                scrollY={scrollY}
                emptyAction={
                  <Button type="primary" icon={<PlusIcon />} onClick={onCreate}>
                    新增工装
                  </Button>
                }
              />
            </TableState>
          </div>
          <div ref={paginationRef} className="mt-4 flex shrink-0 justify-end">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={data?.total ?? 0}
              showSizeChanger
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onChange={onPageChange}
              onShowSizeChange={(_current, size) => onPageSizeChange(size)}
            />
          </div>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        title={editingRecord ? '编辑工装资料' : '新增工装资料'}
        width={860}
        destroyOnHidden
        onCancel={onClose}
        onOk={onSubmit}
        okText="保存"
        cancelText="取消"
        confirmLoading={isSubmitting}
      >
        <div className="space-y-4">
          <FormErrorAlert error={formError} />
          <ToolingFixtureForm
            setFormRef={onSetFormRef}
            onFinish={onFinish}
            isSubmitting={isSubmitting}
            initialValues={editingRecord ?? undefined}
            status={editingRecord?.status ?? '未使用'}
          />
        </div>
      </Modal>
    </div>
  )
}
