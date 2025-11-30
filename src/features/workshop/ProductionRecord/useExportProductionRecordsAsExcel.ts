import { utils, writeFile } from 'xlsx'
import { message } from 'antd'
import { useState } from 'react'
import dayjs from 'dayjs'

import type { ProductionRecordWithRelations } from '@/services/apiProductionRecords'

type MessageApi = ReturnType<typeof message.useMessage>[0]

export function useExportProductionRecordsAsExcel(messageApi?: MessageApi) {
  const [internalMessageApi, contextHolder] = message.useMessage()
  const api = messageApi || internalMessageApi
  const [isExporting, setIsExporting] = useState(false)

  async function exportProductionRecordsAsExcel(
    selectedRecords: ProductionRecordWithRelations[],
  ) {
    // 数据验证
    if (!selectedRecords || selectedRecords.length === 0) {
      api.warning('请选择至少一条数据')
      return
    }

    try {
      setIsExporting(true)

      // 计算日期范围
      const dates = selectedRecords
        .map((r) => (r.production_date ? dayjs(r.production_date) : null))
        .filter((d) => d !== null) as dayjs.Dayjs[]

      let minDate = dayjs()
      let maxDate = dayjs()
      if (dates.length > 0) {
        minDate = dates.reduce((min, d) => (d.isBefore(min) ? d : min), dates[0])
        maxDate = dates.reduce((max, d) => (d.isAfter(max) ? d : max), dates[0])
      }
      const dateRange = `${minDate.format('YY.MM.D')}-${maxDate.format('YY.MM.D')}`

      // 按订单分组数据
      const orderMap = new Map<
        string,
        {
          order: ProductionRecordWithRelations['order']
          records: ProductionRecordWithRelations[]
        }
      >()

      selectedRecords.forEach((record) => {
        // 使用订单ID或订单对象ID作为分组键
        const orderId = record.order_id || record.order?.id || 'unknown'
        if (!orderMap.has(orderId)) {
          orderMap.set(orderId, {
            order: record.order || undefined,
            records: [],
          })
        }
        const group = orderMap.get(orderId)
        if (group) {
          group.records.push(record)
        }
      })

      // 收集所有工序和不良原因
      const processSet = new Set<string>()
      const defectReasonSet = new Set<string>()

      selectedRecords.forEach((record) => {
        if (record.process?.process_name) {
          processSet.add(record.process.process_name)
        }
        if (record.defect_reasons_with_details) {
          record.defect_reasons_with_details.forEach((item) => {
            if (item.defect_reason?.defect_reason) {
              defectReasonSet.add(item.defect_reason.defect_reason)
            }
          })
        }
      })

      // 排序工序和不良原因
      const processes = Array.from(processSet).sort()
      const defectReasons = Array.from(defectReasonSet).sort()

      // 构建表头
      const headers = [
        '序号',
        '项目号',
        '型号',
        '长度',
        '客户型号',
        ...processes, // 动态工序列
        '不合格总数',
        '不良品重量（kg）',
        ...defectReasons, // 动态不良原因列
        '合格率',
      ]

      // 构建表格数据
      const tableData: any[] = []
      let rowIndex = 1

      orderMap.forEach(({ order, records }) => {
        // 计算每个工序的合格数量
        const processQuantities = new Map<string, number>()
        records.forEach((record) => {
          const processName = record.process?.process_name || ''
          if (processName) {
            const current = processQuantities.get(processName) || 0
            processQuantities.set(processName, current + (record.qualified_quantity || 0))
          }
        })

        // 计算每个不良原因的数量
        const defectQuantities = new Map<string, number>()
        let totalDefective = 0
        records.forEach((record) => {
          totalDefective += record.defective_quantity || 0
          if (record.defect_reasons_with_details) {
            record.defect_reasons_with_details.forEach((item) => {
              const reasonName = item.defect_reason?.defect_reason || ''
              if (reasonName) {
                const current = defectQuantities.get(reasonName) || 0
                defectQuantities.set(reasonName, current + (item.quantity || 0))
              }
            })
          }
        })

        // 计算合格总数
        const totalQualified = records.reduce(
          (sum, r) => sum + (r.qualified_quantity || 0),
          0,
        )

        // 计算合格率
        const total = totalQualified + totalDefective
        const passRate = total > 0 ? ((totalQualified / total) * 100).toFixed(2) + '%' : '0%'

        // 构建行数据对象（空值或0值留空）
        const row: any = {
          序号: rowIndex,
          项目号: order?.project_no || '',
          型号: order?.product_model || '',
          长度: order?.length_mm ? `${order.length_mm}mm` : '',
          客户型号: order?.customer_model || '',
        }

        // 添加工序列数据（0值留空）
        processes.forEach((p) => {
          const quantity = processQuantities.get(p) || 0
          row[p] = quantity > 0 ? quantity : ''
        })

        // 添加不合格总数（0值留空）
        row['不合格总数'] = totalDefective > 0 ? totalDefective : ''

        // 计算不良品重量（kg）：项目号对应米重 * 长度 / 1000 * 不良支数
        let defectiveWeight = ''
        if (order?.weight_per_meter_kg && order?.length_mm && totalDefective > 0) {
          const weight = (order.weight_per_meter_kg * (order.length_mm / 1000) * totalDefective)
          defectiveWeight = weight.toFixed(2)
        }
        row['不良品重量（kg）'] = defectiveWeight

        // 添加不良原因列数据（0值留空）
        defectReasons.forEach((r) => {
          const quantity = defectQuantities.get(r) || 0
          row[r] = quantity > 0 ? quantity : ''
        })

        // 添加合格率
        row['合格率'] = passRate

        tableData.push(row)
        rowIndex++
      })

      // 创建Excel工作簿
      const wb = utils.book_new()

      // 将数据转换为工作表
      const ws = utils.json_to_sheet(tableData, {
        header: headers,
      })

      // 设置列宽自适应
      const colWidths: { wch: number }[] = []
      headers.forEach((header) => {
        // 计算该列的最大宽度
        let maxWidth = header.length // 至少为表头长度

        // 遍历所有行，找到该列的最大内容宽度（跳过标题行）
        tableData.forEach((row) => {
          const value = row[header]
          if (value !== null && value !== undefined) {
            const cellValue = String(value)
            // 对于中文字符，每个字符占2个宽度单位
            const chineseCharCount = (cellValue.match(/[\u4e00-\u9fa5]/g) || []).length
            const otherCharCount = cellValue.length - chineseCharCount
            const width = chineseCharCount * 2 + otherCharCount
            maxWidth = Math.max(maxWidth, width)
          }
        })

        // 设置列宽，最小8，最大50，并添加一些边距
        // 对于序号列，可以稍微窄一些
        const minWidth = header === '序号' ? 6 : 8
        colWidths.push({ wch: Math.min(Math.max(maxWidth + 2, minWidth), 50) })
      })

      ws['!cols'] = colWidths

      // 添加工作表到工作簿
      utils.book_append_sheet(wb, ws, '产量记录表')

      // 生成文件名
      const filename = `产量记录表_${dateRange}_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`

      // 导出Excel文件
      writeFile(wb, filename)
      api.success('Excel导出完成')
    } catch (error) {
      console.error('Excel导出失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        selectedRecordsCount: selectedRecords.length,
      })
      api.error(
        error instanceof Error ? `Excel导出失败：${error.message}` : 'Excel导出失败，请重试',
      )
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportProductionRecordsAsExcel,
    contextHolder,
    isExporting,
    messageApi: api,
  }
}

