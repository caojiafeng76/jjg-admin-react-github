import EditButton from '@/ui/EditButton'
import DetailTable from './DetailTable'
import { App, Button, Modal } from 'antd'
import DetailForm from './DetailForm'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { FormInstance } from 'antd/lib'
import { ISyneyItem, ISyneyPo } from '@/types'
import { useItem } from './useItem'
import { useDetail } from './useDetail'
import { useTableHeight } from '@/hooks/useTableHeight'
import AppPagination from '@/ui/AppPagination'
import { TableState } from '@/ui/TableState'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/16/solid'
import dayjs from 'dayjs'

// 状态 pill 语义色（与 PoTable STATUS_STYLES 一致）
const STATUS_PILL: Record<string, string> = {
  已创建: 'bg-rose-50 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
  部分送货:
    'bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  已入库:
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  暂停: 'bg-pink-50 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400',
  作废: 'bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400',
}

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

export default function PoDetail() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const { PoId } = useParams()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const setTableSelectedKeys = useAppStore(
    (state) => state.setTableSelectedKeys,
  )
  const { items, po, isLoading: isDetailLoading } = useDetail()

  const detailFormRef = useRef<{
    getInstance: () => FormInstance<ISyneyItem>
  }>(null)

  const records = useMemo(() => (items as ISyneyItem[]) || [], [items])
  const currentItemIds = useMemo(
    () =>
      records
        .map((item) => item.id)
        .filter((id): id is number => typeof id === 'number'),
    [records],
  )
  const { data } = useItem(currentItemIds)
  const total = records.length

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
        value: p?.EndDate ? dayjs(p.EndDate).format('YYYY-MM-DD') : '-',
      },
      { label: '商标', value: p?.Brand || '-' },
      { label: '工艺要求', value: p?.Technique || '-' },
      { label: '编号', value: p?.SerialNo ?? '-' },
      { label: '备注', value: p?.Remark || '-' },
    ]
  }, [po])

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 订单信息分区卡片 */}
      <div className="app-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
              订单信息
            </span>
          </div>
          {po?.Status && STATUS_PILL[po.Status] ? (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[po.Status]}`}
            >
              {po.Status}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          {orderInfo.map((item) => (
            <InfoItem key={item.label} label={item.label}>
              {item.label === '编号' ? (
                <span className="tabular-nums">{item.value}</span>
              ) : (
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
          <TableState loading={isDetailLoading && records.length === 0}>
            <DetailTable
              loading={isLoading || isDetailLoading}
              data={records}
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
          onClick={() => navigate(-1)}
        >
          返回列表
        </Button>
        <EditButton
          title="选择至少一条数据"
          handleEdit={() => {
            if (!data) {
              message.warning('请先选择一条数据进行编辑')
              return
            }
            setIsModalOpen(true)
            setTimeout(() => {
              detailFormRef.current
                ?.getInstance()
                .setFieldsValue(data as ISyneyItem)
            }, 0)
          }}
        />
      </div>

      <Modal
        title="编辑明细"
        open={isModalOpen}
        confirmLoading={isLoading}
        width={560}
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
