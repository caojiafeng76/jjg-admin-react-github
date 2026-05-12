import { FormInstance } from 'antd'

/**
 * 规格实体类型
 */
export interface ISyneySpec {
  created_at?: string
  id?: number
  ParamSpec: string | null
  PartName: string | null
  PartNo: string | null
  Spec: string | null
  Unit: string | null
}

/**
 * 订单明细实体类型
 */
export interface ISyneyItem {
  created_at?: string
  id?: number
  No: string | null
  ParamSpec: string | null
  /**
   * 标记参数规格是否为系统根据备注推测的结果
   */
  ParamSpecInferred?: boolean | null
  PartName: string | null
  PartName2?: string | null
  PartNo: string | null
  Qty: number | null
  Remark: string | null
  SONo: string | null
  Spec: string | null
  TaxTotalPrice?: number | null
  TaxUnitPrice?: number | null
  Unit: string | null
  PoId?: number | null
  PartCode?: string | null
  PartModel?: string | null
}

/**
 * 库存报告实体类型
 */
export interface ISyneyStoreReport {
  created_at?: string
  id?: number
  No: string
  Status?: string
  TotalAmount?: number | null
  Detail?: string | null
}

/**
 * 采购订单实体类型
 */
export interface ISyneyPo {
  BorderMaterial?: string
  Brand: string | null
  created_at: string
  EndDate: string | null
  id: number
  No: string | null
  Qty: number | null
  Remark: string | null
  SerialNo: number | null
  SONo: string | null
  Spec: string | null
  Status: string | null
  Technique: string | null
  Detail?: string | null
}

/**
 * 规格表单 Ref 类型
 */
export interface ISyneySpecFormRef {
  getInstance(): FormInstance<ISyneySpec>
}

/**
 * 采购订单表单 Ref 类型
 */
export interface ISyneyPoFormRef {
  getInstance(): FormInstance<ISyneyPo>
  getIsLoading(): boolean
}

/**
 * 库存报告表单 Ref 类型
 */
export interface ISyneyStoreReportFormRef {
  getInstance(): FormInstance<ISyneyStoreReport>
}

/**
 * 订单明细表单 Ref 类型
 */
export interface ISyneyItemFormRef {
  getInstance(): FormInstance<ISyneyItem>
}

/**
 * 订单详情表单类型
 */
export type PoDetailFormType = {
  PartNo: string
  ParamSpec: string
  Remark: string
}
