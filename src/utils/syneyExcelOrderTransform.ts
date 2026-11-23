import type { ExcelData, TransformedOrderData } from './excelUtilsTypes'
import type { ISyneyItem, ISyneyPo } from '@/types'
import dayjs from 'dayjs'
import { inferParamSpecFromRemark } from './syney'
import {
  extractBrandFromBackPlate,
  extractSpecFromAllRows,
  extractTechnique,
  inferConsistentSpecFromRows,
} from './syneyExcelOrderInference'

/**
 * 将Excel日期序列号转换为日期字符串
 * @param excelDate Excel日期序列号
 * @returns 格式化的日期字符串 YYYY-MM-DD
 */
function convertExcelDate(excelDate: number | string): string {
  if (typeof excelDate === 'string') {
    // 如果已经是字符串格式，尝试解析
    const parsed = dayjs(excelDate)
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : excelDate
  }

  // Excel日期从1900年1月1日开始计算 (实际上是1899年12月30日)
  // 使用UTC时间计算以避免时区偏差
  const excelEpoch = new Date(Date.UTC(1899, 11, 30))
  const date = new Date(excelEpoch.getTime() + Number(excelDate) * 86400000)

  // 格式化为YYYY-MM-DD
  return date.toISOString().split('T')[0]
}

/**
 * 转换为订单数据格式
 * @param excelData Excel数据
 * @returns 订单主表和明细数据
 */
export function transformToOrderData(
  excelData: ExcelData,
): TransformedOrderData {
  if (!excelData.rows || excelData.rows.length === 0) {
    throw new Error('没有数据可转换')
  }

  const firstRow = excelData.rows[0]
  let specInferred = false

  // 构建订单主表数据
  const po: Partial<ISyneyPo> = {
    No: String(firstRow.采购单号 || ''),
    EndDate: firstRow.交货日期 ? convertExcelDate(firstRow.交货日期) : null,
    Remark: String(firstRow.订单备注 || ''),
    SONo: Array.from(
      new Set(
        excelData.rows
          .map(row => row.生产编号)
          .filter((v): v is string => !!v),
      ),
    ).join('\n'),
    // Spec优先级: 1. API推断 (从Excel行数据推断) 2. 后备逻辑（搜索所有行） 3. Excel规格列 (仅作为后备，但需要验证格式)
    // Brand优先级: 1. 后板备注提取 2. Excel商标列 3. API推断
    Spec: (() => {
      const inferredSpecResult = inferConsistentSpecFromRows(excelData.rows)
      if (inferredSpecResult.spec) {
        return inferredSpecResult.spec
      }
      if (inferredSpecResult.hasMixedSpecs) {
        return null
      }
      // 如果标准推断失败，使用后备逻辑（搜索所有行的spec和remark字段）
      const fallbackSpec = extractSpecFromAllRows(excelData.rows)
      if (fallbackSpec) {
        // 标记为推断的规格，需要用户确认
        specInferred = true
        return fallbackSpec
      }
      // 如果推断失败，检查Excel规格列是否是有效格式（包含"型"字）
      const excelSpec = firstRow.规格 ? String(firstRow.规格) : null
      if (
        excelSpec
        && (excelSpec.includes('型') || /^\d+型-/.test(excelSpec))
      ) {
        return excelSpec
      }
      // 如果Excel规格列格式不对（如"左件"），返回null，让用户手动选择
      return null
    })(),
    Brand: extractBrandFromBackPlate(excelData.rows) || firstRow.商标 || null,
    // 提取工艺要求（用逗号分割，用于分解单；订单列表显示时用空格替换）
    Technique: extractTechnique(excelData.rows),
  }

  // 构建订单明细数据
  const items: Partial<ISyneyItem>[] = excelData.rows.map(row => ({
    No: String(row.采购单号 || ''),
    PartNo: String(row.物料件号 || '').trim(),
    PartName: String(row.物料名称 || ''),
    Spec: String(row.规格 || ''),
    ParamSpec: String(row.参数规格 || ''),
    Qty: Number(row.核算数量) || 0,
    Unit: String(row.核算单位 || ''),
    SONo: String(row.生产编号 || ''),
    Remark: String(row.备注 || ''),
    TaxUnitPrice: null,
    TaxTotalPrice: null,
  }))

  // 如果参数规格无法解析,尝试根据备注推测,并标记为推测结果
  const itemsWithInferredParamSpec = items.map((item) => {
    const { paramSpec, inferred } = inferParamSpecFromRemark(item as ISyneyItem)
    if (!item.ParamSpec && paramSpec) {
      return { ...item, ParamSpec: paramSpec, ParamSpecInferred: inferred }
    }
    return item
  })

  return {
    po,
    items: itemsWithInferredParamSpec,
    specInferred,
  }
}
