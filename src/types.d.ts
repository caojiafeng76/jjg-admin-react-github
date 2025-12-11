import { FormInstance } from 'antd'

// interface ITableRef {}

interface ISyneySpec {
  created_at?: string
  id?: number
  ParamSpec: string | null
  PartName: string | null
  PartNo: string | null
  Spec: string | null
  Unit: string | null
}

interface ISyneyItem {
  [key: string]: string | number | boolean | null
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

interface ISyneyStoreReport {
  created_at?: string
  id?: number
  No: string
  Status?: string
  TotalAmount?: number | null
  Detail?: string | null
}

interface ISyneyPo {
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

interface ISyneySpecFormRef {
  getInstance(): FormInstance<ISyneySpec>
}

interface ISyneyPoFormRef {
  getInstance(): FormInstance<ISyneyPo>
  getIsLoading(): boolean
}
interface ISyneyStoreReportFormRef {
  getInstance(): FormInstance<ISyneyStoreReport>
}

interface ISyneyItemFormRef {
  getInstance(): FormInstance<ISyneyItem>
}

type PoDetailFormType = {
  PartNo: string
  ParamSpec: string
  Remark: string
}
