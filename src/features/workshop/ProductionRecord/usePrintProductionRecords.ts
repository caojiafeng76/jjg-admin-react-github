import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { message } from 'antd'
import { useState } from 'react'
import dayjs from 'dayjs'

import myFont2 from '@/assets/myFont2'
import { openPDFInNewWindow } from '@/utils/pdfUtils'
import type { ProductionRecordWithRelations } from '@/services/apiProductionRecords'

type MessageApi = ReturnType<typeof message.useMessage>[0]

export function usePrintProductionRecords(messageApi?: MessageApi) {
  const [internalMessageApi, contextHolder] = message.useMessage()
  const api = messageApi || internalMessageApi
  const [isPrinting, setIsPrinting] = useState(false)

  async function printProductionRecords(selectedRecords: ProductionRecordWithRelations[]) {
    // 数据验证
    if (!selectedRecords || selectedRecords.length === 0) {
      api.warning('请选择至少一条数据')
      return
    }

    try {
      setIsPrinting(true)

      // 创建 PDF 文档（横向）
      const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' })

      // 设置中文字体
      doc.addFileToVFS('msyh.ttf', myFont2)
      doc.addFont('msyh.ttf', 'myFont', 'normal')
      doc.setFont('myFont')

      // 获取页面尺寸
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

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

      // 设置标题
      doc.setFontSize(16)
      doc.text('产量记录表', pageWidth / 2, 15, { align: 'center' })
      doc.setFontSize(10)
      doc.text(dateRange, pageWidth / 2, 22, { align: 'center' })

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
        ...defectReasons, // 动态不良原因列
        '合格率',
      ]

      // 构建表格数据
      const tableData: string[][] = []
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

        // 构建行数据
        const row: string[] = [
          rowIndex.toString(),
          order?.project_no || '-',
          order?.product_model || '-',
          order?.length_mm ? `${order.length_mm}mm` : '-',
          order?.customer_model || '-',
          ...processes.map((p) => (processQuantities.get(p) || 0).toString()),
          totalDefective.toString(),
          ...defectReasons.map((r) => (defectQuantities.get(r) || 0).toString()),
          passRate,
        ]

        tableData.push(row)
        rowIndex++
      })

      // 计算列宽（动态调整，确保所有列在一页内）
      // 横向A4页面宽度297mm，减小边距以容纳更多列
      const margin = 10 // 左右边距（减小边距）
      const availableWidth = pageWidth - margin * 2
      
      // 固定列宽度（进一步优化）
      const fixedColWidths = [12, 25, 22, 22, 35] // 序号、项目号、型号、长度、客户型号
      const fixedColsTotal = fixedColWidths.reduce((sum, w) => sum + w, 0)
      
      // 预留不合格总数和合格率的宽度
      const totalDefectiveWidth = 22
      const passRateWidth = 22
      const reservedWidth = totalDefectiveWidth + passRateWidth
      
      // 计算动态列的可用宽度
      const dynamicWidth = availableWidth - fixedColsTotal - reservedWidth
      
      // 动态分配工序列和不良原因列的宽度
      const totalDynamicCols = processes.length + defectReasons.length
      const baseColWidth = totalDynamicCols > 0 ? Math.floor(dynamicWidth / totalDynamicCols) : 0
      // 最小列宽设为15mm，确保内容可读
      const processColWidth = Math.max(15, baseColWidth)
      const defectColWidth = Math.max(15, baseColWidth)

      const columnStyles: Record<number, any> = {}
      let colIndex = 0

      // 固定列样式
      columnStyles[colIndex++] = { cellWidth: fixedColWidths[0], halign: 'center' } // 序号
      columnStyles[colIndex++] = { cellWidth: fixedColWidths[1], halign: 'left' } // 项目号
      columnStyles[colIndex++] = { cellWidth: fixedColWidths[2], halign: 'left' } // 型号
      columnStyles[colIndex++] = { cellWidth: fixedColWidths[3], halign: 'left' } // 长度
      columnStyles[colIndex++] = { cellWidth: fixedColWidths[4], halign: 'left' } // 客户型号

      // 工序列样式
      if (processes.length > 0) {
        processes.forEach(() => {
          columnStyles[colIndex++] = {
            cellWidth: processColWidth,
            halign: 'right',
          }
        })
      }

      // 不合格总数
      columnStyles[colIndex++] = { cellWidth: totalDefectiveWidth, halign: 'right' }

      // 不良原因列样式
      if (defectReasons.length > 0) {
        defectReasons.forEach(() => {
          columnStyles[colIndex++] = {
            cellWidth: defectColWidth,
            halign: 'right',
          }
        })
      }

      // 合格率
      columnStyles[colIndex] = { cellWidth: passRateWidth, halign: 'right' }

      // 生成表格
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 30,
        styles: {
          font: 'myFont',
          fontSize: 6,
          cellPadding: 0.5,
          overflow: 'linebreak',
        },
        headStyles: {
          fillColor: [66, 139, 202],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center',
        },
        columnStyles,
        margin: { top: 30, right: margin, bottom: 20, left: margin },
        theme: 'striped',
        showHead: 'everyPage',
        showFoot: 'never',
        tableWidth: 'auto',
        horizontalPageBreak: true,
        horizontalPageBreakRepeat: 0,
      })

      // 添加页码（右下角）
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(9)
        const pageText = `第 ${i} 页，共 ${pageCount} 页`
        doc.text(pageText, pageWidth - 10, pageHeight - 10, {
          align: 'right',
        })
      }

      // 输出 PDF（在新标签页中打开）
      openPDFInNewWindow(doc)
      api.success('打印完成')
    } catch (error) {
      console.error('打印失败:', error)
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        selectedRecordsCount: selectedRecords.length,
      })
      api.error(
        error instanceof Error
          ? `打印失败：${error.message}`
          : '打印失败，请重试',
      )
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    printProductionRecords,
    contextHolder,
    isPrinting,
    messageApi: api,
  }
}

