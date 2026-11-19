import type { MachineRuntimeFilters } from '@/services/apiMachineRuntime'
import { Splitter } from 'antd'
import dayjs from 'dayjs'

import { startTransition, useState } from 'react'
import { useTableHeight } from '@/hooks/useTableHeight'
import FilterBar from '@/ui/FilterBar'
import { TableState } from '@/ui/TableState'
import MachineRuntimeDetailTable from './MachineRuntimeDetailTable'
import MachineRuntimeSearch from './MachineRuntimeSearch'
import MachineRuntimeSummaryTable from './MachineRuntimeSummaryTable'
import { useMachineRuntimeDetail } from './useMachineRuntimeDetail'
import { useMachineRuntimeSummary } from './useMachineRuntimeSummary'

type SummaryFilters = Omit<
  MachineRuntimeFilters,
  'page' | 'pageSize' | 'machineEquipmentId'
>

const DEFAULT_FILTERS: SummaryFilters = {
  dateFrom: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  dateTo: dayjs().format('YYYY-MM-DD'),
}

export default function MachineRuntime() {
  const [summaryFilters, setSummaryFilters]
    = useState<SummaryFilters>(DEFAULT_FILTERS)
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    null,
  )
  const [detailPage, setDetailPage] = useState(1)
  const [detailPageSize, setDetailPageSize] = useState(20)

  const { tableContainerRef: summaryContainerRef, scrollY: summaryScrollY }
    = useTableHeight({ targetRowCount: 6 })
  const { tableContainerRef: detailContainerRef, scrollY: detailScrollY }
    = useTableHeight({ targetRowCount: 8 })

  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useMachineRuntimeSummary(summaryFilters)

  const detailFilters: MachineRuntimeFilters = {
    ...summaryFilters,
    machineEquipmentId: selectedMachineId ?? undefined,
    page: detailPage,
    pageSize: detailPageSize,
  }
  const {
    data: detailResult,
    isLoading: detailLoading,
    error: detailError,
    refetch: refetchDetail,
  } = useMachineRuntimeDetail(detailFilters)

  const handleSearch = (filters: SummaryFilters) => {
    startTransition(() => {
      setSummaryFilters(filters)
      setSelectedMachineId(null)
      setDetailPage(1)
    })
  }

  const handleReset = () => {
    startTransition(() => {
      setSummaryFilters(DEFAULT_FILTERS)
      setSelectedMachineId(null)
      setDetailPage(1)
    })
  }

  const handleSelectMachine = (id: string) => {
    startTransition(() => {
      setSelectedMachineId(prev => (prev === id ? null : id))
      setDetailPage(1)
    })
  }

  const handleDetailPageChange = (page: number, pageSize: number) => {
    startTransition(() => {
      setDetailPage(page)
      setDetailPageSize(pageSize)
    })
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      <FilterBar>
        <MachineRuntimeSearch onSearch={handleSearch} onReset={handleReset} />
      </FilterBar>

      {/* 上下布局：汇总 + 明细 */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <Splitter orientation="vertical" className="h-full">
          <Splitter.Panel defaultSize="40%" min="20%">
            <div className="flex h-full flex-col gap-2 overflow-hidden pb-2">
              <div className="border-b border-divider pb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                设备运行汇总
              </div>
              <div
                ref={summaryContainerRef}
                className="min-h-0 flex-1 overflow-hidden"
              >
                <TableState
                  loading={summaryLoading && !summaryData}
                  error={summaryError}
                  onRetry={refetchSummary}
                >
                  <MachineRuntimeSummaryTable
                    loading={summaryLoading}
                    data={summaryData || []}
                    selectedId={selectedMachineId}
                    onSelect={handleSelectMachine}
                    scrollY={summaryScrollY}
                  />
                </TableState>
              </div>
            </div>
          </Splitter.Panel>

          <Splitter.Panel min="20%">
            <div className="flex h-full flex-col gap-2 overflow-hidden pt-2">
              <div className="border-b border-divider pb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {selectedMachineId
                  ? `运行明细（${
                    summaryData?.find(
                      s => s.machine_equipment_id === selectedMachineId,
                    )?.unified_device_no ?? ''
                  }）`
                  : '运行明细（点击上方设备行筛选）'}
              </div>
              <div
                ref={detailContainerRef}
                className="min-h-0 flex-1 overflow-hidden"
              >
                <TableState
                  loading={detailLoading && !detailResult}
                  error={detailError}
                  onRetry={refetchDetail}
                >
                  <MachineRuntimeDetailTable
                    loading={detailLoading}
                    data={detailResult?.items || []}
                    total={detailResult?.total || 0}
                    page={detailPage}
                    pageSize={detailPageSize}
                    onPageChange={handleDetailPageChange}
                    scrollY={detailScrollY}
                  />
                </TableState>
              </div>
            </div>
          </Splitter.Panel>
        </Splitter>
      </div>
    </div>
  )
}
