import type { ProjectNoData } from './mobileProductionOrderScanTypes'

import type { MobileBottomSelectOption } from '@/ui/mobile/MobileBottomSelectSheet'
import { useMemo } from 'react'
import {
  formatDisplayValue,

} from './mobileProductionOrderScanTypes'
import { useMachineEquipmentOptions } from './useMachineEquipmentOptions'
import {
  useOperationsByModel,
  useSalesOrdersProjectNos,
} from './useProcessStandards'

interface UseMobileProductionOrderScanOptionsParams {
  scannedProjectDataMap: Record<string, ProjectNoData>
  projectNo: string
  operation: string
  machineEquipmentId: string | null | undefined
}

export function useMobileProductionOrderScanOptions({
  scannedProjectDataMap,
  projectNo,
  operation,
  machineEquipmentId,
}: UseMobileProductionOrderScanOptionsParams) {
  const { data: projectNos } = useSalesOrdersProjectNos()
  const { data: machineOptions } = useMachineEquipmentOptions()

  const projectInfoMap = useMemo(() => {
    const map = new Map<string, ProjectNoData>()

    ;(projectNos || []).forEach((item) => {
      map.set(item.project_no, item)
    })

    Object.entries(scannedProjectDataMap).forEach(([key, value]) => {
      map.set(key, value)
    })

    return map
  }, [projectNos, scannedProjectDataMap])

  const currentProject = projectNo ? projectInfoMap.get(projectNo) : undefined
  const currentProductModel = currentProject?.product_model || ''

  const { data: operationMatch } = useOperationsByModel({
    model: currentProductModel || undefined,
    length: currentProject?.length_mm,
    partNo: currentProject?.material_code,
  })

  const operationRecords = useMemo(
    () => operationMatch?.records ?? [],
    [operationMatch?.records],
  )
  const selectedOperationRecord = operationRecords.find(
    item => item.operation === operation,
  )

  const projectOptions = useMemo<MobileBottomSelectOption[]>(() => {
    return Array.from(projectInfoMap.values()).map(item => ({
      value: item.project_no,
      label: item.project_no,
      keywords: [
        item.project_no,
        item.product_model || '',
        item.length_mm || '',
        item.customer_model || '',
      ].join(' '),
      description: (
        <div className="grid grid-cols-3 gap-2">
          <span className="truncate">
            型号: {formatDisplayValue(item.product_model)}
          </span>
          <span className="truncate">
            长度: {formatDisplayValue(item.length_mm)}
          </span>
          <span className="truncate">
            客户型号: {formatDisplayValue(item.customer_model)}
          </span>
        </div>
      ),
    }))
  }, [projectInfoMap])

  const operationOptions = useMemo<MobileBottomSelectOption[]>(() => {
    return operationRecords.map(item => ({
      value: item.operation,
      label: item.operation,
      keywords: [
        item.operation,
        item.record_type || '',
        item.part_no || '',
      ].join(' '),
    }))
  }, [operationRecords])

  const machineSelectOptions = useMemo<MobileBottomSelectOption[]>(() => {
    return [
      {
        value: '__none__',
        label: '无',
        keywords: '无 none',
        description: '不指定机器编号',
      },
      ...((machineOptions || []).map(item => ({
        value: item.id,
        label: item.unified_device_no,
        keywords: [
          item.unified_device_no,
          item.operation,
          item.machine_name,
        ].join(' '),
        description: `${item.operation} / ${item.machine_name}`,
      })) as MobileBottomSelectOption[]),
    ]
  }, [machineOptions])

  const currentMachineLabel = useMemo(() => {
    if (machineEquipmentId === undefined) {
      return '请选择机器编号'
    }

    if (machineEquipmentId === null) {
      return '无'
    }

    return (
      machineOptions?.find(item => item.id === machineEquipmentId)
        ?.unified_device_no || '请选择机器编号'
    )
  }, [machineEquipmentId, machineOptions])

  return {
    projectNos,
    currentProject,
    currentProductModel,
    operationMatch,
    selectedOperationRecord,
    projectOptions,
    operationOptions,
    machineSelectOptions,
    currentMachineLabel,
  }
}
