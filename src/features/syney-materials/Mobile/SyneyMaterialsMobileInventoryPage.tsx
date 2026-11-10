import type { SyneyMaterialsInventory } from '@/services/apiSyneyMaterialsInventory'
import type { SyneyMaterialsStockDirection } from '@/services/apiSyneyMaterialsStock'
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { Button, Drawer, Empty, Segmented, Spin } from 'antd'
import dayjs from 'dayjs'
import { useState } from 'react'

import { usePermission } from '@/hooks/usePermission'
import { useSyneyMaterialsInventoryList } from '../Inventory/useSyneyMaterialsInventory'
import {
  SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY,
  SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY,
} from '../permissions'
import { useSyneyMaterialsStockRecords } from '../Stock/useSyneyMaterialsStock'
import SyneyMaterialsMobileShell from './SyneyMaterialsMobileShell'
import SyneyMaterialsMobileStockSheet from './SyneyMaterialsMobileStockSheet'
import { useMobileList } from './useMobileList'

function RecentRecords({
  direction,
  inventoryId,
}: {
  direction: SyneyMaterialsStockDirection
  inventoryId: string
}) {
  const { data, isLoading } = useSyneyMaterialsStockRecords(direction, {
    inventoryId,
    page: 1,
    pageSize: 10,
  })
  const items = data?.items ?? []

  if (isLoading)
    return <div className="flex h-24 items-center justify-center"><Spin /></div>

  if (items.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={direction === 'in' ? '暂无入库记录' : '暂无出库记录'}
      />
    )
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-700">
      {items.map(record => (
        <div key={record.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <div className="text-sm text-slate-700 dark:text-slate-200">
              {dayjs(record.created_at).format('MM-DD HH:mm')}
            </div>
            <div className="truncate text-xs text-slate-400">{record.remarks || '无备注'}</div>
          </div>
          <div
            className={`shrink-0 font-bold tabular-nums ${direction === 'in' ? 'text-green-600' : 'text-red-500'}`}
          >
            {direction === 'in' ? '+' : '-'}
            {record.quantity}
          </div>
        </div>
      ))}
      {data && data.total > items.length
        ? <div className="pt-2 text-center text-xs text-slate-400">仅显示最近 10 条</div>
        : null}
    </div>
  )
}

/** 手机端查库存：只读卡片，点开可直接入库 / 出库 */
export default function SyneyMaterialsMobileInventoryPage() {
  const canStockIn = usePermission(SYNEY_MATERIALS_STOCK_IN_PERMISSION_KEY)
  const canStockOut = usePermission(SYNEY_MATERIALS_STOCK_OUT_PERMISSION_KEY)
  const { searchValue, setSearchValue, keyword, pageSize, loadMore } = useMobileList()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [recordsTab, setRecordsTab] = useState<SyneyMaterialsStockDirection>('in')
  const [sheetDirection, setSheetDirection] = useState<SyneyMaterialsStockDirection | null>(null)

  const { data, isLoading, isFetching, error, refetch } = useSyneyMaterialsInventoryList({
    page: 1,
    pageSize,
    keyword,
  })
  const items = data?.items ?? []
  // 出入库后列表会刷新，抽屉里的数量跟着变
  const active: SyneyMaterialsInventory | null
    = items.find(item => item.id === activeId) ?? null

  const recordDirections = [
    ...(canStockIn ? ['in' as const] : []),
    ...(canStockOut ? ['out' as const] : []),
  ]
  const currentRecordsTab = recordDirections.includes(recordsTab)
    ? recordsTab
    : recordDirections[0]

  return (
    <>
      <SyneyMaterialsMobileShell
        title="查库存"
        description="点材料可查看最近出入库，并直接登记"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        loading={isLoading && !data}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={items.length === 0}
        emptyText={keyword ? '没有匹配的材料' : '还没有材料资料'}
        shownCount={items.length}
        total={data?.total ?? 0}
        loadingMore={isFetching && !isLoading}
        onLoadMore={loadMore}
      >
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveId(item.id)}
            className="flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 text-left shadow-[0_8px_30px_rgba(15,23,42,0.08)] active:scale-[0.99] dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                {item.material_name}
              </div>
              <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {item.specification || '无规格'}
              </div>
            </div>
            <div
              className={`shrink-0 text-2xl font-black tabular-nums ${item.quantity === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-900 dark:text-slate-100'}`}
            >
              {item.quantity.toLocaleString('zh-CN')}
              <span className="ml-1 text-xs font-medium text-slate-400">{item.unit}</span>
            </div>
          </button>
        ))}
      </SyneyMaterialsMobileShell>

      <Drawer
        open={Boolean(active)}
        title="材料库存"
        placement="bottom"
        size="78vh"
        onClose={() => setActiveId(null)}
        styles={{ body: { padding: 16 } }}
      >
        {active
          ? (
              <div className="flex flex-col gap-4 pb-[env(safe-area-inset-bottom)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {active.material_name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      规格：{active.specification || '-'}
                    </div>
                    {active.remarks
                      ? <div className="mt-1 text-xs text-slate-400">备注：{active.remarks}</div>
                      : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-slate-400">当前库存</div>
                    <div className="text-3xl font-black text-slate-900 tabular-nums dark:text-slate-100">
                      {active.quantity.toLocaleString('zh-CN')}
                      <span className="ml-1 text-sm font-medium text-slate-400">{active.unit}</span>
                    </div>
                  </div>
                </div>

                {canStockIn || canStockOut
                  ? (
                      <div className="grid grid-cols-2 gap-3">
                        {canStockIn
                          ? (
                              <Button
                                type="primary"
                                size="large"
                                icon={<ArrowDownTrayIcon className="size-5" />}
                                onClick={() => setSheetDirection('in')}
                                className="h-12 rounded-2xl"
                              >
                                入库
                              </Button>
                            )
                          : null}
                        {canStockOut
                          ? (
                              <Button
                                size="large"
                                icon={<ArrowUpTrayIcon className="size-5" />}
                                disabled={active.quantity === 0}
                                onClick={() => setSheetDirection('out')}
                                className="h-12 rounded-2xl"
                              >
                                出库
                              </Button>
                            )
                          : null}
                      </div>
                    )
                  : null}

                {currentRecordsTab
                  ? (
                      <div>
                        {recordDirections.length > 1
                          ? (
                              <Segmented<SyneyMaterialsStockDirection>
                                block
                                value={currentRecordsTab}
                                onChange={setRecordsTab}
                                options={[
                                  { value: 'in', label: '最近入库' },
                                  { value: 'out', label: '最近出库' },
                                ]}
                              />
                            )
                          : (
                              <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                {currentRecordsTab === 'in' ? '最近入库' : '最近出库'}
                              </div>
                            )}
                        <div className="mt-2">
                          <RecentRecords
                            key={`${active.id}-${currentRecordsTab}`}
                            direction={currentRecordsTab}
                            inventoryId={active.id}
                          />
                        </div>
                      </div>
                    )
                  : null}
              </div>
            )
          : null}
      </Drawer>

      <SyneyMaterialsMobileStockSheet
        open={sheetDirection !== null}
        direction={sheetDirection ?? 'in'}
        presetInventory={active}
        onClose={() => setSheetDirection(null)}
      />
    </>
  )
}
