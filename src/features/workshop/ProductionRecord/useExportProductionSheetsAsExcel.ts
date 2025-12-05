import { useState, useCallback } from 'react'
import { utils, writeFile } from 'xlsx'
import dayjs from 'dayjs'
import type { MessageInstance } from 'antd/es/message/interface'

import type { ProductionRecordWithRelations } from '@/services/apiProductionRecords'
import { getProductionRecordsBySheetIds } from '@/services/apiProductionSheets'

export function useExportProductionSheetsAsExcel(messageApi?: MessageInstance) {
  const [isExporting, setIsExporting] = useState(false)

  const exportProductionSheetsAsExcel = useCallback(
    async (sheetIds: string[]) => {
      if (!sheetIds || sheetIds.length === 0) {
        messageApi?.warning('请先选择产量单')
        return
      }
      setIsExporting(true)
      try {
        const records = await getProductionRecordsBySheetIds(sheetIds)
        if (!records || records.length === 0) {
          messageApi?.warning('所选产量单中没有记录')
          return
        }

        // 统计并透视：每项目一行，工序为列（合格数），不良原因为列（不良数），末尾附不良总数/不良重量/合格率
        type OrderKey = string
        type ProcessName = string
        type DefectReason = string

        const processSet = new Set<ProcessName>()
        const reasonSet = new Set<DefectReason>()
        const rowsMap = new Map<
          OrderKey,
          {
            project_no: string
            product_model: string
            customer_model: string
            length_mm: number | null
            weight_per_meter_kg: number | null
            processQualified: Map<ProcessName, number>
            defectsByReason: Map<DefectReason, number>
          }
        >()

        const makeOrderKey = (record: ProductionRecordWithRelations) => {
          const order = record.order
          return [
            order?.project_no || '',
            order?.product_model || '',
            order?.customer_model || '',
            order?.length_mm ?? '',
            order?.weight_per_meter_kg ?? '',
          ].join('||')
        }

        records.forEach((record) => {
          const key = makeOrderKey(record)
          const processName = record.process?.process_name || '-'
          processSet.add(processName)
          const row =
            rowsMap.get(key) ||
            rowsMap
              .set(key, {
                project_no: record.order?.project_no || '',
                product_model: record.order?.product_model || '',
                customer_model: record.order?.customer_model || '',
                length_mm: record.order?.length_mm ?? null,
                weight_per_meter_kg: record.order?.weight_per_meter_kg ?? null,
                processQualified: new Map(),
                defectsByReason: new Map(),
              })
              .get(key)!

          const q = record.qualified_quantity || 0
          row.processQualified.set(processName, (row.processQualified.get(processName) || 0) + q)

          const defectList =
            record.defect_reasons_with_details && record.defect_reasons_with_details.length > 0
              ? record.defect_reasons_with_details
              : null

          if (defectList) {
            defectList.forEach((d: { defect_reason?: { defect_reason?: string } | null; quantity?: number }) => {
              const rName = d?.defect_reason?.defect_reason || '-'
              reasonSet.add(rName)
              const qty = d?.quantity || 0
              row.defectsByReason.set(rName, (row.defectsByReason.get(rName) || 0) + qty)
            })
          } else {
            reasonSet.add('-')
          }
        })

        const processColumns = Array.from(processSet)
        const reasonColumns = Array.from(reasonSet)
        const header = [
          '项目号',
          '产品型号',
          '客户型号',
          '长度(mm)',
          '米重(kg/m)',
          ...processColumns,
          ...reasonColumns,
          '不良总数',
          '不良重量(kg)',
          '合格率',
        ]

        const wsData: (string | number)[][] = [header]

        rowsMap.forEach((row) => {
          const totalQualified = processColumns.reduce((sum, p) => {
            const v = row.processQualified.get(p) || 0
            return sum + v
          }, 0)
          const defectTotal = reasonColumns.reduce(
            (sum, r) => sum + (row.defectsByReason.get(r) || 0),
            0,
          )
          const total = totalQualified + defectTotal
          const yieldRate = total > 0 ? ((totalQualified / total) * 100).toFixed(2) : '0.00'
          const lengthMm = row.length_mm ?? 0
          const weightPerMeter = row.weight_per_meter_kg ?? 0
          const defectWeight =
            lengthMm && weightPerMeter
              ? ((lengthMm / 1000) * weightPerMeter * defectTotal).toFixed(2)
              : '0.00'

          wsData.push([
            row.project_no,
            row.product_model,
            row.customer_model,
            row.length_mm ?? '',
            row.weight_per_meter_kg ?? '',
            ...processColumns.map((p) => {
              const v = row.processQualified.get(p) || 0
              return v === 0 ? '' : v
            }),
            ...reasonColumns.map((r) => {
              const v = row.defectsByReason.get(r) || 0
              return v === 0 ? '' : v
            }),
            defectTotal,
            defectWeight,
            `${yieldRate}%`,
          ])
        })

        const wb = utils.book_new()
        const ws = utils.aoa_to_sheet(wsData)
        utils.book_append_sheet(wb, ws, '产量单汇总')
        const filename = `产量单汇总_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`
        writeFile(wb, filename)
        messageApi?.success('导出成功')
      } catch (error: unknown) {
        console.error(error)
        const message =
          error instanceof Error ? error.message : typeof error === 'string' ? error : '导出失败'
        messageApi?.error(message || '导出失败')
      } finally {
        setIsExporting(false)
      }
    },
    [messageApi],
  )

  return {
    exportProductionSheetsAsExcel,
    isExporting,
  }
}

