import type { SyneySafePartCheckResult, SyneySafePartSourceRow } from '@/services/syneyDeliveryOrderContract'
import type { ISyneyItem } from '@/services/types'
import type { SyneySafePartRule } from '@/utils/syneySafePartRules'
import dayjs from 'dayjs'

import {
  getLabelInfoBySettings,
  getLabelInfoFromStoredItem,
  isSafePartBySettings,
} from '@/utils/syneySafePartRules'

/** 一张订单（一个生产号）的安全部件来源 */
export interface SafePartPoSource {
  No: string | null
  EndDate: string | null
  SONo: string | null
  SerialNo: string | number | null
  items: ISyneyItem[]
}

/** 「导出安全部件信息」的一行（不含序号） */
export interface SafePartInfoRow {
  采购单号: string | null
  日期: string | null
  编号: string | null | undefined
  型号: string | null | undefined
  名称: string | null | undefined
  件号: string | null
  生产号: string | null
}

/**
 * 过滤安全件并补齐编号/型号/名称：DB 已存字段优先，为空时（新件号尚未写入）从件号配置推导。
 * 「导出安全部件信息」与「生成送货单」填写 SCM 安全部件共用此函数。
 */
export function buildSafePartInfoRows(
  po: SafePartPoSource,
  settings: SyneySafePartRule[] | undefined,
): SafePartInfoRow[] {
  return po.items
    .filter(item => isSafePartBySettings(item.PartNo, settings))
    .map((item) => {
      const labelInfo
        = item.PartCode && item.PartModel && item.PartName2
          ? null
          : (getLabelInfoBySettings(item.PartNo, po.SerialNo ?? '', settings)
            ?? getLabelInfoFromStoredItem(item, settings))

      return {
        采购单号: po.No,
        日期: po.EndDate,
        编号: item.PartCode || labelInfo?.partCode,
        型号: item.PartModel || labelInfo?.partModel,
        名称: item.PartName2 || labelInfo?.partName2,
        件号: item.PartNo,
        生产号: po.SONo,
      }
    })
}

/** 转为送货单代理需要的字段：日期（订单交货日期）用作 SCM「制造日期」 */
export function toSafePartSourceRows(rows: SafePartInfoRow[]): SyneySafePartSourceRow[] {
  return rows.map(row => ({
    SONo: row.生产号 ?? '',
    PartNo: row.件号 ?? '',
    partCode: row.编号 ?? '',
    partModel: row.型号 ?? '',
    partName: row.名称 ?? '',
    date: row.日期 && dayjs(row.日期).isValid() ? dayjs(row.日期).format('YYYY-MM-DD') : '',
  }))
}

/**
 * 按 SCM 明细的 IsSafePart 过滤要导出的订单：SCM 明确查到且全部为 false 的订单号跳过；
 * SCM 查不到的订单号保留，按本系统件号配置导出。
 */
export function filterPosBySafePartCheck<T extends { poInfo: { No: string | null } }>(
  posList: T[],
  results: SyneySafePartCheckResult[],
): { kept: T[], skippedPoNos: string[] } {
  const noSafePartPoNos = new Set(
    results.filter(result => result.found && !result.hasSafeParts).map(result => result.poNo),
  )
  const kept = posList.filter(({ poInfo }) => !noSafePartPoNos.has((poInfo.No ?? '').trim()))
  const skippedPoNos = Array.from(noSafePartPoNos).filter(poNo =>
    posList.some(({ poInfo }) => (poInfo.No ?? '').trim() === poNo),
  )
  return { kept, skippedPoNos }
}
