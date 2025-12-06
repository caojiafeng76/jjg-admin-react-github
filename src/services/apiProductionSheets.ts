/* eslint-disable @typescript-eslint/no-explicit-any */
import supabase from './supabase'
import { handleApiError } from '@/utils/errorHandler'
import type { ProductionRecord, ProductionRecordWithRelations } from './apiProductionRecords'

export interface ProductionSheet {
  id?: string
  production_date: string
  working_hours?: number | null
  remark?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProductionSheetRecord extends ProductionRecord {
  production_sheet_id?: string
}

export interface ProductionSheetWithRecords extends ProductionSheet {
  records?: ProductionSheetRecord[]
  record_count?: number
  total_qualified_quantity?: number
  total_defective_quantity?: number
  operators?: { id: string; name: string }[]
}

// 根据产量单ID批量获取记录（含订单/工序关联）
export async function getProductionRecordsBySheetIds(sheetIds: string[]) {
  if (!sheetIds || sheetIds.length === 0) return []

  const { data, error } = await (supabase.from('production_records') as any)
    .select(
      `
      *,
      sales_orders!production_records_order_id_fkey (
        id,
        project_no,
        product_model,
        customer_model,
        length_mm,
        weight_per_meter_kg
      ),
      workshop_processes!production_records_process_id_fkey (
        id,
        process_name
      )
    `,
    )
    .in('production_sheet_id', sheetIds)

  if (error) {
    throw handleApiError(error, '获取产量单记录失败')
  }

  // 补充操作者与不良原因详情
  const records = (data || []) as any[]
  const recordsWithRelations = await Promise.all(
    records.map(async (record) => {
      const result: any = {
        ...record,
        order: record.sales_orders || null,
        process: record.workshop_processes || null,
      }
      delete result.sales_orders
      delete result.workshop_processes

      if (record.operator_ids && record.operator_ids.length > 0) {
        const { data: operators } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', record.operator_ids)
        result.operators = operators || []
      } else {
        result.operators = []
      }

      if (
        record.defect_reasons &&
        Array.isArray(record.defect_reasons) &&
        record.defect_reasons.length > 0
      ) {
        const defectReasonIds = record.defect_reasons
          .map((item: any) => item.defect_reason_id)
          .filter(Boolean)

        if (defectReasonIds.length > 0) {
          const { data: defectReasons } = await supabase
            .from('workshop_defect_reasons' as any)
            .select('id, defect_reason')
            .in('id', defectReasonIds)

          result.defect_reasons_with_details = record.defect_reasons.map((item: any) => {
            const defectReason = (defectReasons as any)?.find(
              (dr: any) => dr.id === item.defect_reason_id,
            )
            return {
              ...item,
              defect_reason: defectReason || null,
            }
          })
        } else {
          result.defect_reasons_with_details = []
        }
      } else {
        result.defect_reasons_with_details = []
      }

      return result
    }),
  )

  return recordsWithRelations as ProductionRecordWithRelations[]
}

// 获取产量单列表
export async function getProductionSheets({
  page,
  pageSize,
  startDate,
  endDate,
}: {
  page: number
  pageSize: number
  startDate?: string
  endDate?: string
}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = (supabase.from('production_sheets' as any) as any).select('*', { count: 'exact' })

  // 日期范围搜索
  if (startDate && endDate) {
    query = query.gte('production_date', startDate).lte('production_date', endDate)
  } else if (startDate) {
    query = query.gte('production_date', startDate)
  } else if (endDate) {
    query = query.lte('production_date', endDate)
  }

  const { data, error, count } = await query
    .range(from, to)
    .order('production_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw handleApiError(error, '获取产量单失败')
  }

  const sheets = (data || []) as ProductionSheet[]

  // 预取所有 sheet 的记录基础数据，用于统计和操作者
  const sheetIds = sheets.map((s: ProductionSheet) => s.id).filter(Boolean) as string[]
  let recordsBySheet: Record<
    string,
    { qualified_quantity: number; defective_quantity: number; operator_ids: string[] | null }[]
  > = {}
  const operatorIdSet = new Set<string>()
  if (sheetIds.length > 0) {
    const { data: records } = await supabase
      .from('production_records')
      .select('production_sheet_id, qualified_quantity, defective_quantity, operator_ids')
      .in('production_sheet_id', sheetIds as string[])

    const recordsData: {
      production_sheet_id?: string
      qualified_quantity?: number
      defective_quantity?: number
      operator_ids?: string[]
    }[] = Array.isArray(records) ? (records as any[]) : []

    recordsBySheet = recordsData.reduce(
      (
        acc: typeof recordsBySheet,
        r: {
          production_sheet_id?: string
          qualified_quantity?: number
          defective_quantity?: number
          operator_ids?: string[]
        },
      ) => {
        const sid = r.production_sheet_id
        if (!sid) return acc
        acc[sid] = acc[sid] || []
        acc[sid].push({
          qualified_quantity: r.qualified_quantity || 0,
          defective_quantity: r.defective_quantity || 0,
          operator_ids: r.operator_ids || [],
        })
        if (r.operator_ids && Array.isArray(r.operator_ids)) {
          r.operator_ids.forEach((oid: string) => oid && operatorIdSet.add(oid))
        }
        return acc
      },
      {},
    )
  }

  // 批量获取操作者姓名
  const operatorMap: Record<string, { id: string; name: string }> = {}
  if (operatorIdSet.size > 0) {
    const { data: ops } = await supabase
      .from('employees')
      .select('id, name')
      .in('id', Array.from(operatorIdSet))
    if (ops) {
      ops.forEach((op) => {
        if (op.id) operatorMap[op.id] = { id: op.id, name: op.name }
      })
    }
  }

  // 组装统计数据
  const sheetsWithStats = sheets.map((sheet: ProductionSheet) => {
    const sid = sheet.id ?? ''
    const recs =
      recordsBySheet[sid] ||
      ([] as { qualified_quantity: number; defective_quantity: number; operator_ids: string[] | null }[])
    const recordCount = recs.length
    const totalQualified = recs.reduce(
      (sum: number, r: { qualified_quantity: number }) => sum + (r.qualified_quantity || 0),
      0,
    )
    const totalDefective = recs.reduce(
      (sum: number, r: { defective_quantity: number }) => sum + (r.defective_quantity || 0),
      0,
    )
    const operatorIds = Array.from(
      new Set(
        recs.flatMap((r) => (r.operator_ids && Array.isArray(r.operator_ids) ? r.operator_ids : [])),
      ),
    )
    const operators = operatorIds
      .map((id) => operatorMap[id] as { id: string; name: string } | undefined)
      .filter(Boolean) as { id: string; name: string }[]

    return {
      ...sheet,
      record_count: recordCount,
      total_qualified_quantity: totalQualified,
      total_defective_quantity: totalDefective,
      operators,
    } as ProductionSheetWithRecords
  })

  return {
    items: sheetsWithStats,
    total: count || 0,
  }
}

// 获取单个产量单及其所有记录
export async function getProductionSheetById(id: string) {
    const { data: sheet, error: sheetError } = await (supabase.from('production_sheets' as any) as any)
    .select('*')
    .eq('id', id)
    .single()

  if (sheetError) {
    throw handleApiError(sheetError, '获取产量单失败')
  }

  const { data: records, error: recordsError } = await supabase
    .from('production_records')
    .select(
      `
      *,
      sales_orders!production_records_order_id_fkey (
        id,
        project_no,
        product_model,
        customer_model,
        length_mm,
        weight_per_meter_kg
      ),
      workshop_processes!production_records_process_id_fkey (
        id,
        process_name
      )
    `
    )
    .eq('production_sheet_id', id)
    .order('created_at', { ascending: true })

  if (recordsError) {
    throw handleApiError(recordsError, '获取产量记录失败')
  }

  // 获取操作者和不良原因信息
  const recordsWithRelations = await Promise.all(
    (records || []).map(async (record: any) => {
      const result: any = {
        ...record,
        order: record.sales_orders || null,
        process: record.workshop_processes || null,
      }
      delete result.sales_orders
      delete result.workshop_processes

      // 获取操作者信息
      if (record.operator_ids && record.operator_ids.length > 0) {
        const { data: operators } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', record.operator_ids)

        result.operators = operators || []
      } else {
        result.operators = []
      }

      // 获取不良原因详细信息
      if (record.defect_reasons && Array.isArray(record.defect_reasons) && record.defect_reasons.length > 0) {
        const defectReasonIds = record.defect_reasons
          .map((item: any) => item.defect_reason_id)
          .filter(Boolean)

        if (defectReasonIds.length > 0) {
          const { data: defectReasons } = await supabase
            .from('workshop_defect_reasons' as any)
            .select('id, defect_reason')
            .in('id', defectReasonIds)

          result.defect_reasons_with_details = record.defect_reasons.map((item: any) => {
            const defectReason = (defectReasons as any)?.find((dr: any) => dr.id === item.defect_reason_id)
            return {
              ...item,
              defect_reason: defectReason || null,
            }
          })
        } else {
          result.defect_reasons_with_details = []
        }
      } else {
        result.defect_reasons_with_details = []
      }

      return result
    }),
  )

  return {
    ...sheet,
    records: recordsWithRelations,
  } as ProductionSheetWithRecords
}

// 创建产量单（包含多个产量记录）
export async function createProductionSheet({
  production_date,
  operator_ids,
  working_hours,
  remark,
  records,
}: {
  production_date: string
  operator_ids: string[]
  working_hours?: number | null
  remark?: string | null
      records: Omit<ProductionSheetRecord, 'id' | 'production_sheet_id' | 'created_at' | 'updated_at' | 'operator_ids'>[]
}) {
  // 验证至少有一条记录
  if (!records || records.length === 0) {
    throw new Error('至少需要添加一条产量记录')
  }

  // 验证操作者
  if (!operator_ids || operator_ids.length === 0) {
    throw new Error('请至少选择一个操作者')
  }

  // 创建产量单
  const { data: sheet, error: sheetError } = await (supabase.from('production_sheets' as any) as any)
    .insert({
      production_date,
      working_hours: working_hours || null,
      remark: remark || null,
    })
    .select()
    .single()

  if (sheetError) {
    throw handleApiError(sheetError, '创建产量单失败')
  }

  // 计算每条记录的不良总数并创建产量记录
  const recordsToInsert = records.map((record) => {
    const totalDefectiveQuantity = record.defect_reasons
      ? record.defect_reasons.reduce((sum, item) => sum + (item.quantity || 0), 0)
      : 0

        return {
          ...record,
          production_sheet_id: sheet.id,
          production_date, // 使用产量单的日期
          operator_ids, // 使用产量单的操作者
          defective_quantity: totalDefectiveQuantity,
          defect_reasons: (record.defect_reasons || []) as any,
        }
  })

  const { error: recordsError } = await supabase
    .from('production_records')
    .insert(recordsToInsert as any)

  if (recordsError) {
    // 如果插入记录失败，删除已创建的产量单
    await (supabase.from('production_sheets' as any) as any).delete().eq('id', sheet.id as string)
    throw handleApiError(recordsError, '创建产量记录失败')
  }

  return sheet
}

// 更新产量单（包含更新记录）
export async function updateProductionSheet({
  id,
  production_date,
  operator_ids,
  working_hours,
  remark,
  records,
}: {
  id: string
  production_date?: string
  operator_ids?: string[]
  working_hours?: number | null
  remark?: string | null
  records?: Omit<ProductionSheetRecord, 'id' | 'production_sheet_id' | 'created_at' | 'updated_at' | 'operator_ids' | 'working_hours'>[]
}) {
  // 更新产量单基本信息
  const updateData: Record<string, unknown> = {}
  if (production_date) updateData.production_date = production_date
  if (working_hours !== undefined) updateData.working_hours = working_hours
  if (remark !== undefined) updateData.remark = remark

  const { error: sheetError } = await (supabase.from('production_sheets' as any) as any).update(updateData).eq('id', id)

  if (sheetError) {
    throw handleApiError(sheetError, '更新产量单失败')
  }

  // 如果提供了记录，则更新记录
  if (records !== undefined) {
    // 验证操作者
    if (!operator_ids || operator_ids.length === 0) {
      throw new Error('请至少选择一个操作者')
    }

    // 删除所有旧记录
    const { error: deleteError } = await supabase.from('production_records').delete().eq('production_sheet_id', id)

    if (deleteError) {
      throw handleApiError(deleteError, '删除旧记录失败')
    }

    // 创建新记录
    if (records.length > 0) {
      // 获取产量单的日期（如果未提供）
      let sheetDate = production_date
      if (!sheetDate) {
        const { data: sheet } = await (supabase.from('production_sheets' as any) as any)
          .select('production_date')
          .eq('id', id)
          .single()
        if (sheet) {
          sheetDate = sheet.production_date
        }
      }

      const recordsToInsert = records.map((record) => {
        const totalDefectiveQuantity = record.defect_reasons
          ? record.defect_reasons.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0

        return {
          ...record,
          production_sheet_id: id,
          production_date: sheetDate,
          operator_ids,
          defective_quantity: totalDefectiveQuantity,
          defect_reasons: (record.defect_reasons || []) as any,
        }
      })

      const { error: insertError } = await supabase.from('production_records').insert(recordsToInsert as any)

      if (insertError) {
        throw handleApiError(insertError, '更新产量记录失败')
      }
    }
  }
}

// 删除产量单（级联删除所有记录）
export async function deleteProductionSheets(ids: string[]) {
  const { error } = await (supabase.from('production_sheets' as any) as any).delete().in('id', ids)

  if (error) {
    throw handleApiError(error, '删除产量单失败')
  }
}

// 向产量单添加记录
export async function addRecordToSheet(sheetId: string, record: Omit<ProductionSheetRecord, 'id' | 'production_sheet_id' | 'created_at' | 'updated_at'>) {
  if (!record.operator_ids || record.operator_ids.length === 0) {
    throw new Error('至少需要选择一个操作者')
  }

  // 获取产量单的日期
  const { data: sheet } = await (supabase.from('production_sheets' as any) as any)
    .select('production_date')
    .eq('id', sheetId)
    .single()

  if (!sheet) {
    throw new Error('产量单不存在')
  }

  const totalDefectiveQuantity = record.defect_reasons
    ? record.defect_reasons.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : 0

  const recordToInsert = {
    ...record,
    production_sheet_id: sheetId,
    production_date: sheet.production_date,
    defective_quantity: totalDefectiveQuantity,
    defect_reasons: (record.defect_reasons || []) as any,
  }

  const { error } = await supabase.from('production_records').insert(recordToInsert as any)

  if (error) {
    throw handleApiError(error, '添加产量记录失败')
  }
}

// 从产量单删除记录
export async function removeRecordFromSheet(recordId: string) {
  const { error } = await supabase.from('production_records').delete().eq('id', recordId)

  if (error) {
    throw handleApiError(error, '删除产量记录失败')
  }
}

