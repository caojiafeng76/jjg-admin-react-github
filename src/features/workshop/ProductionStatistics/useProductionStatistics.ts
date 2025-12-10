import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'

import {
  getProductionRecords,
  type ProductionRecordWithRelations,
} from '@/services/apiProductionRecords'
import { queryConfig } from '@/config/queryClient'

export interface ProductionStatisticsSearchParams {
  startDate?: string
  endDate?: string
  project_no?: string
  product_model?: string
  operator_id?: string
}

export interface ProductionStatisticsRow {
  key: string
  orderId: string
  projectNo: string
  productModel: string
  customerModel: string
  lengthMm?: number | null
  dateRange: string
  qualifiedQuantity: number
  defectiveQuantity: number
  operators: string[]
  defectReasonCounts: Record<string, number>
}

function aggregateStatistics(records: ProductionRecordWithRelations[]) {
  const defectReasonSet = new Set<string>()
  const grouped = new Map<string, ProductionStatisticsRow & { dates: string[] }>()

  records.forEach((record, index) => {
    const orderId = record.order_id || `unknown-${index}`
    const reasonCounts =
      record.defect_reasons_with_details?.reduce<Record<string, number>>(
        (acc, reasonItem) => {
          const name =
            reasonItem.defect_reason?.defect_reason || reasonItem.defect_reason_id
          if (name) {
            acc[name] = (acc[name] || 0) + (reasonItem.quantity || 0)
            defectReasonSet.add(name)
          }
          return acc
        },
        {},
      ) || {}

    const existing = grouped.get(orderId)
    const productionDate = record.production_date

    if (existing) {
      existing.qualifiedQuantity += record.qualified_quantity || 0
      existing.defectiveQuantity += record.defective_quantity || 0
      existing.operators = Array.from(
        new Set([
          ...existing.operators,
          ...(record.operators?.map((op) => op.name) || []),
        ]),
      )
      existing.dates = productionDate
        ? [...existing.dates, productionDate]
        : existing.dates

      Object.entries(reasonCounts).forEach(([reason, qty]) => {
        existing.defectReasonCounts[reason] =
          (existing.defectReasonCounts[reason] || 0) + qty
      })
    } else {
      grouped.set(orderId, {
        key: orderId,
        orderId,
        projectNo: record.order?.project_no || '-',
        productModel: record.order?.product_model || '-',
        customerModel: record.order?.customer_model || '-',
        lengthMm: record.order?.length_mm,
        qualifiedQuantity: record.qualified_quantity || 0,
        defectiveQuantity: record.defective_quantity || 0,
        operators: record.operators?.map((op) => op.name) || [],
        defectReasonCounts: reasonCounts,
        dates: productionDate ? [productionDate] : [],
        dateRange: '',
      })
    }
  })

  const rows = Array.from(grouped.values()).map((row) => {
    const dates = row.dates
    let dateRange = '-'
    if (dates.length > 0) {
      const minDate = dates.reduce((min, current) =>
        dayjs(current).isBefore(min) ? current : min,
      )
      const maxDate = dates.reduce((max, current) =>
        dayjs(current).isAfter(max) ? current : max,
      )
      dateRange = `${dayjs(minDate).format('YYYY-MM-DD')} ~ ${dayjs(maxDate).format(
        'YYYY-MM-DD',
      )}`
    }

    return {
      ...row,
      dateRange,
    }
  })

  return {
    rows,
    defectReasonColumns: Array.from(defectReasonSet).sort(),
  }
}

export function useProductionStatistics(searchParams: ProductionStatisticsSearchParams) {
  const { data, isLoading } = useQuery({
    queryKey: ['production-statistics', searchParams],
    queryFn: () =>
      getProductionRecords({
        page: 1,
        pageSize: 5000,
        ...searchParams,
      }),
    ...queryConfig.list,
  })

  const aggregated = useMemo(
    () => aggregateStatistics(data?.items || []),
    [data?.items],
  )

  return {
    data: aggregated,
    isLoading,
  }
}

