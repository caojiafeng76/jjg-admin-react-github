import type { FormInstance } from 'antd'
import type { Dayjs } from 'dayjs'
import type {
  ToolingFixture,
  ToolingFixtureFormValues,
} from '@/services/apiToolingFixture'

import { PlusIcon, TrashIcon } from '@heroicons/react/16/solid'
import PrintButton from '@ui/PrintButton'
import {
  Button,
  DatePicker,
  Input,
  Modal,
  Pagination,
  Select,
} from 'antd'
import FilterBar from '@/ui/FilterBar'
import FormErrorAlert from '@/ui/FormErrorAlert'
import { TableState } from '@/ui/TableState'
import ToolingFixtureExcelImport from './ToolingFixtureExcelImport'
import ToolingFixtureForm from './ToolingFixtureForm'
import ToolingFixtureTable from './ToolingFixtureTable'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

interface FixtureDataViewProps {
  data: { items: ToolingFixture[], total: number } | undefined
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
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 操作工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="primary"
          icon={<PlusIcon className="size-4" />}
          onClick={onCreate}
        >
          新增工装
        </Button>
        <ToolingFixtureExcelImport
          onImport={onImport}
          isImporting={isImporting}
        />
        <PrintButton
          handlePrint={onPrintFiltered}
          loading={isPrinting || isPrintLoading}
        >
          打印二维码
        </PrintButton>
        {selectedRowKeys.length > 0
          ? (
              <Button
                type="text"
                danger
                icon={<TrashIcon className="size-4" />}
                onClick={onDeleteSelected}
              >
                删除选中
              </Button>
            )
          : null}
      </div>

      {/* 筛选栏 */}
      <FilterBar className="flex flex-wrap items-center gap-3">
        <Input.Search
          allowClear
          placeholder="搜索编号、产品、设备、责任人"
          defaultValue={keyword}
          onSearch={onSearch}
          style={{ width: 280, maxWidth: '85vw' }}
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
          style={{ width: 240 }}
          onChange={value =>
            onManufacturedDateChange(
              value?.[0] && value?.[1] ? [value[0], value[1]] : null,
            )}
        />
        <DatePicker.RangePicker
          allowClear
          format="YYYY-MM-DD"
          placeholder={['更新开始日期', '更新结束日期']}
          value={updatedDateRange}
          style={{ width: 240 }}
          onChange={value =>
            onUpdatedDateChange(
              value?.[0] && value?.[1] ? [value[0], value[1]] : null,
            )}
        />
      </FilterBar>

      {/* 表格区域 */}
      <div
        ref={tableContainerRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
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
              emptyAction={(
                <Button
                  type="primary"
                  icon={<PlusIcon className="size-4" />}
                  onClick={onCreate}
                >
                  新增工装
                </Button>
              )}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
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

      <Modal
        open={modalOpen}
        title={editingRecord ? '编辑工装资料' : '新增工装资料'}
        width={720}
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
