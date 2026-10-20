import type { ProductionItemWithOrderDetail } from './apiProductionOrderTypes'
import { handleApiError } from '@/utils/errorHandler'
import supabase from './supabase'

export async function getProductionItemsByProjectNo(
  projectNo: string,
): Promise<ProductionItemWithOrderDetail[]> {
  const PAGE_SIZE = 1000
  const rows: Array<{
    id: string
    operation: string
    project_no: string
    product_model: string | null
    length_mm: number | null
    customer_model: string | null
    qualified_quantity: number
    incoming_qualified_quantity: number
    defect_quantity_1: number
    defect_quantity_2: number
    defect_reason_1: string | null
    defect_reason_2: string | null
    outsource_defect_quantity: number
    outsource_defect_reason: string | null
    outsource_unit: string | null
    setup_defect_quantity: number
    setup_responsible: string | null
    standard_seconds: number
    remark: string | null
    order_id: string
    production_orders: {
      id: string
      order_date: string
      shift: string
      employee: { name: string } | null
    } | null
  }> = []
  let from = 0

  while (true) {
    const to = from + PAGE_SIZE - 1
    const { data, error } = await supabase
      .from('production_order_items')
      .select(
        `
      *,
      production_orders(
        id,
        order_date,
        shift,
        employee:employees(name)
      )
    `,
      )
      .eq('project_no', projectNo.trim())
      .neq('data_category', 'B')
      .order('operation', { ascending: true })
      .order('created_at', { ascending: true })
      .range(from, to)

    if (error) {
      throw handleApiError(error, '获取生产工单明细失败')
    }

    const pageRows = (data || []) as unknown as Array<{
      id: string
      operation: string
      project_no: string
      product_model: string | null
      length_mm: number | null
      customer_model: string | null
      qualified_quantity: number
      incoming_qualified_quantity: number
      defect_quantity_1: number
      defect_quantity_2: number
      defect_reason_1: string | null
      defect_reason_2: string | null
      outsource_defect_quantity: number
      outsource_defect_reason: string | null
      outsource_unit: string | null
      setup_defect_quantity: number
      setup_responsible: string | null
      standard_seconds: number
      remark: string | null
      order_id: string
      production_orders: {
        id: string
        order_date: string
        shift: string
        employee: { name: string } | null
      } | null
    }>
    rows.push(...pageRows)

    if (pageRows.length < PAGE_SIZE) {
      break
    }

    from += PAGE_SIZE
  }

  return rows.map(item => ({
    id: item.id,
    operation: item.operation,
    project_no: item.project_no,
    product_model: item.product_model,
    length_mm: item.length_mm,
    customer_model: item.customer_model,
    qualified_quantity: item.qualified_quantity,
    incoming_qualified_quantity: item.incoming_qualified_quantity,
    defect_quantity_1: item.defect_quantity_1,
    defect_quantity_2: item.defect_quantity_2,
    defect_reason_1: item.defect_reason_1,
    defect_reason_2: item.defect_reason_2,
    outsource_defect_quantity: item.outsource_defect_quantity,
    outsource_defect_reason: item.outsource_defect_reason,
    outsource_unit: item.outsource_unit,
    setup_defect_quantity: item.setup_defect_quantity,
    setup_responsible: item.setup_responsible,
    standard_seconds: item.standard_seconds,
    remark: item.remark,
    order_id: item.order_id,
    order_date: item.production_orders?.order_date ?? '',
    shift: item.production_orders?.shift ?? '',
    employee_name: item.production_orders?.employee?.name ?? null,
  }))
}
