/**
 * 西尼 SCM「生成送货单」代理接口契约。
 * 前端（apiSyneyDeliveryOrder）与服务端（server/syneyDeliveryOrderServer）共用，只放类型与常量。
 */

export const SYNEY_DELIVERY_ORDER_PERMISSION = 'feature:syney-po-list.delivery-order'
export const SYNEY_DELIVERY_ORDER_DEV_PROXY_URL = '/api/syney-delivery-order'

/** 本系统导出的一条安全部件信息（与「导出安全部件信息」同源） */
export interface SyneySafePartSourceRow {
  SONo: string
  PartNo: string
  /** 编号 → SCM SafePartNo */
  partCode: string
  /** 型号 → SCM SafePartModel */
  partModel: string
  /** 名称 → SCM PartNameType */
  partName: string
  /** 订单交货日期 YYYY-MM-DD → SCM SafePartFCDate（制造日期） */
  date: string
}

/** 一条待添加到 SCM 的安全部件明细（SafePartDetailEdit 表单） */
export interface SyneySafePartDetailPlanItem {
  /** SCM 安全部件行 PKID */
  SaftPartID: number
  SupplierCode: string
  SupplierName: string
  SONo: string
  PartNo: string
  SafePartNo: string
  SafePartModel: string
  PartNameType: string
  /** YYYY-MM-DD */
  SafePartFCDate: string
}

export interface SyneyDeliveryOrderRequestMap {
  create: { poNo: string }
  planSafeParts: { deliveryNo: string, parts: SyneySafePartSourceRow[] }
  addSafePartDetail: { item: SyneySafePartDetailPlanItem }
  confirm: { deliveryOrderId: number, deliveryNo: string }
  print: { deliveryOrderIds: number[], deliveryNos: string[] }
}

export interface SyneyDeliveryOrderResponseMap {
  create: {
    deliveryOrderId: number
    deliveryNo: string
    lineCount: number
    /** 已存在未确认的送货单且没有可送明细时，沿用该送货单 */
    reused: boolean
  }
  planSafeParts: {
    items: SyneySafePartDetailPlanItem[]
    /** SCM 中已存在相同编号的明细数（跳过） */
    skipped: number
    /** SCM 安全部件行数 */
    rowCount: number
    warnings: string[]
  }
  addSafePartDetail: { skipped: boolean, message: string }
  confirm: { alreadyConfirmed: boolean, message: string }
  print: { fileName: string, contentType: string, base64: string }
}

export type SyneyDeliveryOrderAction = keyof SyneyDeliveryOrderRequestMap

export const SYNEY_DELIVERY_ORDER_ACTIONS = [
  'create',
  'planSafeParts',
  'addSafePartDetail',
  'confirm',
  'print',
] as const satisfies readonly SyneyDeliveryOrderAction[]

export const MAX_SAFE_PART_SOURCE_ROWS = 500
export const MAX_PRINT_DELIVERY_ORDERS = 50
