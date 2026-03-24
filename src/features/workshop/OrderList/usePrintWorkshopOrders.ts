import { useState } from 'react'
import { App } from 'antd'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { initializePDF } from '@/utils/pdfUtils'
import { GOOGLE_FONT_CONFIG } from '@/utils/googleFontLoader'
import type { WorkshopOrder } from './index'

// 表格列定义
const TABLE_COLUMNS = [
  '序号',
  '产品交货日期',
  '项目号',
  '产品型号',
  '长度(mm)',
  '客户型号',
  '订支数',
  '每米理论重(kg/m)',
  '颜色名称',
  '包装名称',
  '产品类别',
  '材质名称',
  '料号',
] as const

export function usePrintWorkshopOrders() {
  const { message } = App.useApp()
  const [isPrinting, setIsPrinting] = useState(false)

  async function generatePDF(selectedOrders: WorkshopOrder[]) {
    if (selectedOrders.length === 0) {
      message.warning('请选择要打印的订单')
      return false
    }

    try {
      setIsPrinting(true)

      // 初始化 PDF 文档（横向）
      const fontFamily = GOOGLE_FONT_CONFIG.FONT_FAMILY
      const doc = await initializePDF('l')
      doc.setFont(fontFamily, GOOGLE_FONT_CONFIG.FONT_STYLE)

      // 处理表格数据
      const tableData = selectedOrders.map((order, index) => [
        (index + 1).toString(),
        order.product_delivery_date || '',
        order.project_no || '',
        order.product_model || '',
        order.length_mm?.toString() || '',
        order.customer_model || '',
        order.order_quantity?.toString() || '',
        order.weight_per_meter_kg?.toString() || '',
        order.color_name || '',
        order.package_name || '',
        order.product_category || '',
        order.material_name || '',
        order.material_code || '',
      ])

      // 生成表格
      autoTable(doc, {
        head: [Array.from(TABLE_COLUMNS)],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 0, 0], // 黑色背景
          textColor: [255, 255, 255], // 白色文字
          font: fontFamily,
          fontStyle: GOOGLE_FONT_CONFIG.FONT_STYLE,
          fontSize: 9,
        },
        styles: {
          font: fontFamily,
          fontStyle: GOOGLE_FONT_CONFIG.FONT_STYLE,
          fontSize: 8,
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
          halign: 'center',
          valign: 'middle',
        },
        margin: { top: 30 },
        startY: 20,
        willDrawPage: () => {
          // 添加标题
          doc.setFontSize(16)
          doc.text(
            '车间订单列表',
            doc.internal.pageSize.getWidth() / 2,
            15,
            { align: 'center' }
          )

          // 添加打印日期
          doc.setFontSize(10)
          doc.text(
            `打印日期: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
            doc.internal.pageSize.getWidth() - 20,
            15,
            { align: 'right' }
          )
        },
        didDrawPage: (data) => {
          // 添加页码
          const pageCount = doc.getNumberOfPages()
          doc.setFontSize(10)
          doc.text(
            `第 ${data.pageNumber} 页 / 共 ${pageCount} 页`,
            doc.internal.pageSize.getWidth() - 20,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'right' }
          )
        },
      })

      // 生成文件名
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss')
      const filename = `车间订单_${selectedOrders.length}条_${timestamp}.pdf`

      // 输出 PDF
      doc.save(filename)

      message.success(`PDF生成成功: ${filename}`)
      return true
    } catch (error) {
      console.error('生成PDF时发生错误:', error)
      message.error(error instanceof Error ? error.message : 'PDF生成失败，请重试')
      return false
    } finally {
      setIsPrinting(false)
    }
  }

  return {
    generatePDF,
    isPrinting,
  }
}

