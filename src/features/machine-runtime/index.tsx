import { startTransition, useState } from 'react'
import { Card, Splitter } from 'antd'
import dayjs from 'dayjs'

import { useTableHeight } from '@/hooks/useTableHeight'
import type { MachineRuntimeFilters } from '@/services/apiMachineRuntime'
import MachineRuntimeSearch from './MachineRuntimeSearch'
import MachineRuntimeSummaryTable from './MachineRuntimeSummaryTable'
import MachineRuntimeDetailTable from './MachineRuntimeDetailTable'
import { useMachineRuntimeSummary } from './useMachineRuntimeSummary'
import { useMachineRuntimeDetail } from './useMachineRuntimeDetail'

type SummaryFilters = Omit<
  MachineRuntimeFilters,
  'page' | 'pageSize' | 'machineEquipmentId'
>

const DEFAULT_FILTERS: SummaryFilters = {
  dateFrom: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  dateTo: dayjs().format('YYYY-MM-DD'),
}

export default function MachineRuntime() {
  const [summaryFilters, setSummaryFilters] =
    useState<SummaryFilters>(DEFAULT_FILTERS)
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(
    null,
  )
  const [detailPage, setDetailPage] = useState(1)
  const [detailPageSize, setDetailPageSize] = useState(20)

  const { tableContainerRef: summaryContainerRef, scrollY: summaryScrollY } =
    useTableHeight({ targetRowCount: 6 })
  const { tableContainerRef: detailContainerRef, scrollY: detailScrollY } =
    useTableHeight({ targetRowCount: 8 })

  const { data: summaryData, isLoading: summaryLoading } =
    useMachineRuntimeSummary(summaryFilters)

  const detailFilters: MachineRuntimeFilters = {
    ...summaryFilters,
    machineEquipmentId: selectedMachineId ?? undefined,
    page: detailPage,
    pageSize: detailPageSize,
  }
  const { data: detailResult, isLoading: detailLoading } =
    useMachineRuntimeDetail(detailFilters)

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
      setSelectedMachineId((prev) => (prev === id ? null : id))
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
    <div className="flex h-full flex-col gap-3 p-4">
      {/* 筛选栏 */}
      <Card size="small">
        <MachineRuntimeSearch onSearch={handleSearch} onReset={handleReset} />
      </Card>

      {/* 上下布局：汇总 + 明细 */}
      <div className="flex-1 overflow-hidden">
        <Splitter layout="vertical" className="h-full">
          <Splitter.Panel defaultSize="40%" min="20%">
            <Card
              size="small"
              title="设备运行汇总"
              className="h-full"
              styles={{ body: { padding: '8px', height: 'calc(100% - 48px)' } }}
            >
              <div ref={summaryContainerRef} className="h-full">
                <MachineRuntimeSummaryTable
                  loading={summaryLoading}
                  data={summaryData || []}
                  selectedId={selectedMachineId}
                  onSelect={handleSelectMachine}
                  scrollY={summaryScrollY}
                />
              </div>
            </Card>
          </Splitter.Panel>

          <Splitter.Panel min="20%">
            <Card
              size="small"
              title={
                selectedMachineId
                  ? `运行明细（${
                      summaryData?.find(
                        (s) => s.machine_equipment_id === selectedMachineId,
                      )?.unified_device_no ?? ''
                    }）`
                  : '运行明细（点击上方设备行筛选）'
              }
              className="h-full"
              styles={{ body: { padding: '8px', height: 'calc(100% - 48px)' } }}
            >
              <div ref={detailContainerRef} className="h-full">
                <MachineRuntimeDetailTable
                  loading={detailLoading}
                  data={detailResult?.items || []}
                  total={detailResult?.total || 0}
                  page={detailPage}
                  pageSize={detailPageSize}
                  onPageChange={handleDetailPageChange}
                  scrollY={detailScrollY}
                />
              </div>
            </Card>
          </Splitter.Panel>
        </Splitter>
      </div>
    </div>
  )
}
