import type {
  SyneyMaterialsStockDirection,
  SyneyMaterialsStockRecord,
} from '@/services/apiSyneyMaterialsStock'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Button } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'

import { usePermission } from '@/hooks/usePermission'
import { SYNEY_MATERIALS_STOCK_LABELS } from '@/services/apiSyneyMaterialsStock'
import { SYNEY_MATERIALS_STOCK_PERMISSION_KEYS } from '../permissions'
import { useSyneyMaterialsStockList } from '../Stock/useSyneyMaterialsStock'
import SyneyMaterialsMobileRecordSheet from './SyneyMaterialsMobileRecordSheet'
import SyneyMaterialsMobileShell from './SyneyMaterialsMobileShell'
import SyneyMaterialsMobileStockSheet from './SyneyMaterialsMobileStockSheet'
import { useMobileList } from './useMobileList'

export interface SyneyMaterialsMobileStockPageProps {
  direction: SyneyMaterialsStockDirection
}

/** 手机端材料入库 / 出库：最近记录卡片 + 底部「新增」 */
export default function SyneyMaterialsMobileStockPage({
  direction,
}: SyneyMaterialsMobileStockPageProps) {
  const label = SYNEY_MATERIALS_STOCK_LABELS[direction]
  const canManage = usePermission(SYNEY_MATERIALS_STOCK_PERMISSION_KEYS[direction])
  const { searchValue, setSearchValue, keyword, pageSize, loadMore } = useMobileList()
  const [createOpen, setCreateOpen] = useState(false)
  const [activeRecord, setActiveRecord] = useState<SyneyMaterialsStockRecord | null>(null)

  const { data, isLoading, isFetching, error, refetch } = useSyneyMaterialsStockList(
    direction,
    { page: 1, pageSize, keyword },
  )
  const items = data?.items ?? []

  return (
    <>
      <SyneyMaterialsMobileShell
        title={`材料${label}`}
        description={direction === 'in' ? '登记到货，库存随即增加' : '登记领用，库存随即减少'}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        loading={isLoading && !data}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={items.length === 0}
        emptyText={keyword ? '没有匹配的记录' : `还没有${label}记录`}
        shownCount={items.length}
        total={data?.total ?? 0}
        loadingMore={isFetching && !isLoading}
        onLoadMore={loadMore}
        footer={canManage
          ? (
              <Button
                type="primary"
                size="large"
                block
                icon={<PlusIcon className="size-5" />}
                onClick={() => setCreateOpen(true)}
                className="h-12 rounded-2xl text-base"
              >
                新增{label}
              </Button>
            )
          : undefined}
      >
        {items.map(record => (
          <button
            key={record.id}
            type="button"
            onClick={() => setActiveRecord(record)}
            className="w-full rounded-3xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_8px_30px_rgba(15,23,42,0.08)] active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                  {record.material_name}
                </div>
                <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {record.specification || '无规格'}
                </div>
              </div>
              <div
                className={`shrink-0 text-xl font-black tabular-nums ${direction === 'in' ? 'text-green-600' : 'text-red-500'}`}
              >
                {direction === 'in' ? '+' : '-'}
                {record.quantity}
                <span className="ml-1 text-xs font-medium">{record.unit}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-400">
              <span className="min-w-0 truncate">{record.remarks || '无备注'}</span>
              <span className="shrink-0">{dayjs(record.created_at).format('MM-DD HH:mm')}</span>
            </div>
          </button>
        ))}
      </SyneyMaterialsMobileShell>

      <SyneyMaterialsMobileStockSheet
        open={createOpen}
        direction={direction}
        onClose={() => setCreateOpen(false)}
      />

      <SyneyMaterialsMobileRecordSheet
        direction={direction}
        record={activeRecord}
        canManage={canManage}
        onClose={() => setActiveRecord(null)}
      />
    </>
  )
}
