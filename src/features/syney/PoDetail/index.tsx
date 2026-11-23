import type { FormInstance } from 'antd/lib'
import type { ISyneyItem, ISyneyPo } from '@/types'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import { App, Button, Modal } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTableHeight } from '@/hooks/useTableHeight'
import AppPagination from '@/ui/AppPagination'
import EditButton from '@/ui/EditButton'
import StatusPill from '@/ui/StatusPill'
import { TableState } from '@/ui/TableState'
import { formatDate } from '@/utils/format'
import { PO_STATUS_TONES } from '../statusTones'
import TableSelectionProvider from '../TableSelectionProvider'
import { useTableSelection } from '../useTableSelection'
import DetailForm from './DetailForm'
import DetailTable from './DetailTable'
import { useDetail } from './useDetail'

function InfoItem({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {children}
      </div>
    </div>
  )
}

function PoDetailContent() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  // 从列表进入时携带列表地址（含筛选/分页）；直接打开详情时回到列表首页
  const listHref
    = (location.state as { from?: string } | null)?.from || '/syney-po-list'
  const { PoId } = useParams()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()
  const { items, po, isLoading: isDetailLoading, isFetching: isDetailFetching, error: detailError, refetch } = useDetail()

  const detailFormRef = useRef<{
    getInstance: () => FormInstance<ISyneyItem>
  }>(null)

  const records = useMemo(() => (items as ISyneyItem[]) || [], [items])
  const total = records.length
  const paginatedRecords = useMemo(
    () => records.slice((page - 1) * pageSize, page * pageSize),
    [records, page, pageSize],
  )
  // 直接从已加载的全量明细中派生当前选中项，不再额外发起单条详情请求
  const selectedItem = useMemo(
    () => records.find(item => item.id === Number(tableSelectedKeys[0])),
    [records, tableSelectedKeys],
  )

  useEffect(() => {
    setTableSelectedKeys([])
  }, [PoId, setTableSelectedKeys])

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 39,
  })

  const orderInfo = useMemo(() => {
    const p = po as ISyneyPo | undefined
    return [
      { label: '订单号', value: p?.No || '-' },
      { label: '生产号', value: p?.SONo || '-' },
      { label: '规格', value: p?.Spec || '-' },
      {
        label: '交货日期',
        value: formatDate(p?.EndDate),
      },
      { label: '商标', value: p?.Brand || '-' },
      { label: '工艺要求', value: p?.Technique || '-' },
      { label: '编号', value: p?.SerialNo ?? '-' },
      { label: '备注', value: p?.Remark || '-' },
    ]
  }, [po])

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 订单信息轻量分栏区 */}
      <div className="border-b border-slate-200 pb-3 dark:border-slate-700">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            订单信息
          </span>
          {po?.Status && PO_STATUS_TONES[po.Status]
            ? <StatusPill tone={PO_STATUS_TONES[po.Status]}>{po.Status}</StatusPill>
            : null}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          {orderInfo.map(item => (
            <InfoItem key={item.label} label={item.label}>
              {item.label === '编号'
                ? (
                    <span className="tabular-nums">{item.value}</span>
                  )
                : (
                    item.value
                  )}
            </InfoItem>
          ))}
          <InfoItem label="数量">
            <span className="text-lg font-bold text-slate-900 tabular-nums dark:text-slate-100">
              {po?.Qty?.toLocaleString() ?? '-'}
            </span>
          </InfoItem>
        </div>
      </div>

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <TableState
            loading={isDetailLoading && !po}
            error={detailError}
            onRetry={refetch}
          >
            <DetailTable
              loading={isLoading || isDetailFetching}
              data={paginatedRecords}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={total} />
        </div>
      </div>

      {/* 底部吸底操作区 */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200/60 pt-3 dark:border-slate-700">
        <Button
          icon={<ArrowLeftIcon className="h-4 w-4" />}
          onClick={() => navigate(listHref)}
        >
          返回列表
        </Button>
        <EditButton
          title="选择至少一条数据"
          permissionKey="feature:syney-po-list.edit"
          handleEdit={() => {
            if (!selectedItem) {
              message.warning('请选择一条订单明细进行编辑')
              return
            }
            setIsModalOpen(true)
          }}
        />
      </div>

      <Modal
        title="编辑明细"
        open={isModalOpen}
        confirmLoading={isLoading}
        width={520}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (open && selectedItem) {
            detailFormRef.current
              ?.getInstance()
              .setFieldsValue(selectedItem)
          }
        }}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => {
          detailFormRef.current?.getInstance().submit()
        }}
      >
        <DetailForm
          ref={detailFormRef}
          onClose={() => setIsModalOpen(false)}
          onLoadingChange={setIsLoading}
        />
      </Modal>
    </div>
  )
}

/** 选中状态随页面实例独立（多标签页缓存下互不影响） */
export default function PoDetail() {
  return (
    <TableSelectionProvider>
      <PoDetailContent />
    </TableSelectionProvider>
  )
}
