import { useState } from 'react'

export function useMobileProductionOrderScanForm() {
  const [projectNo, setProjectNo] = useState<string>('')
  const [operation, setOperation] = useState<string>('')
  const [machineEquipmentId, setMachineEquipmentId] = useState<
    string | null | undefined
  >(undefined)
  const [incomingQualifiedQuantity, setIncomingQualifiedQuantity]
    = useState<number>(0)
  const [qualifiedQuantity, setQualifiedQuantity] = useState<number>(0)
  const [defectQuantity1, setDefectQuantity1] = useState<number>(0)
  const [defectQuantity2, setDefectQuantity2] = useState<number>(0)
  const [outsourceDefectQuantity, setOutsourceDefectQuantity]
    = useState<number>(0)
  const [outsourceDefectReason, setOutsourceDefectReason] = useState('')
  const [outsourceUnit, setOutsourceUnit] = useState('')
  const [setupDefectQuantity, setSetupDefectQuantity] = useState<number>(0)
  const [setupResponsible, setSetupResponsible] = useState('')
  const [remark, setRemark] = useState('')

  const resetForm = () => {
    setProjectNo('')
    setOperation('')
    setMachineEquipmentId(undefined)
    setIncomingQualifiedQuantity(0)
    setQualifiedQuantity(0)
    setDefectQuantity1(0)
    setDefectQuantity2(0)
    setOutsourceDefectQuantity(0)
    setOutsourceDefectReason('')
    setOutsourceUnit('')
    setSetupDefectQuantity(0)
    setSetupResponsible('')
    setRemark('')
  }

  return {
    projectNo,
    setProjectNo,
    operation,
    setOperation,
    machineEquipmentId,
    setMachineEquipmentId,
    incomingQualifiedQuantity,
    setIncomingQualifiedQuantity,
    qualifiedQuantity,
    setQualifiedQuantity,
    defectQuantity1,
    setDefectQuantity1,
    defectQuantity2,
    setDefectQuantity2,
    outsourceDefectQuantity,
    setOutsourceDefectQuantity,
    outsourceDefectReason,
    setOutsourceDefectReason,
    outsourceUnit,
    setOutsourceUnit,
    setupDefectQuantity,
    setSetupDefectQuantity,
    setupResponsible,
    setSetupResponsible,
    remark,
    setRemark,
    resetForm,
  }
}

export type MobileProductionOrderScanForm = ReturnType<
  typeof useMobileProductionOrderScanForm
>
