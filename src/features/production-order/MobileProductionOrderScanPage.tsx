import type {
  ActiveSheet,
  ProjectNoData,
  ScanPageLocationState,
} from './mobileProductionOrderScanTypes'
import type { ScannedProjectPayload } from './ProjectNoScanButton'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Typography } from 'antd'
import dayjs from 'dayjs'

import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import {
  addProductionOrderItem,
  updateProductionOrderItem,
} from '@/services/apiProductionOrderItems'
import {
  createProductionOrder,
  getEmployeeOrderByDate,
} from '@/services/apiProductionOrders'
import MobileBottomSelectSheet from '@/ui/mobile/MobileBottomSelectSheet'
import MobileProductionOrderScanBasicInfo from './MobileProductionOrderScanBasicInfo'
import MobileProductionOrderScanHeader from './MobileProductionOrderScanHeader'
import MobileProductionOrderScanQuantitySections from './MobileProductionOrderScanQuantitySections'
import { useMobileProductionOrderScanForm } from './useMobileProductionOrderScanForm'
import { useMobileProductionOrderScanOptions } from './useMobileProductionOrderScanOptions'

const { Paragraph, Title } = Typography

export default function MobileProductionOrderScanPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const { role, employeeProfile } = useAuth()
  const isEmployeeView = isEmployeeSideRole(role)
  const employeeId = employeeProfile?.id ?? null
  const employeeName = employeeProfile?.name ?? '未绑定员工'
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  const scanForm = useMobileProductionOrderScanForm()
  const {
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
  } = scanForm
  const [scannedProjectDataMap, setScannedProjectDataMap] = useState<
    Record<string, ProjectNoData>
  >({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const appliedScanRef = useRef<string | null>(null)

  const {
    projectNos,
    currentProject,
    currentProductModel,
    operationMatch,
    selectedOperationRecord,
    projectOptions,
    operationOptions,
    machineSelectOptions,
    currentMachineLabel,
  } = useMobileProductionOrderScanOptions({
    scannedProjectDataMap,
    projectNo,
    operation,
    machineEquipmentId,
  })

  const navigationState = location.state as ScanPageLocationState | null
  const scannedProjectFromNavigation = navigationState?.scannedProject
  const returnTo = navigationState?.returnTo || '/production-order'
  const targetOrderId = navigationState?.orderId
  const editingItem = navigationState?.editingItem
  const isEditMode = Boolean(editingItem?.id)
  const isExistingOrderMode = Boolean(targetOrderId)

  const handleProjectNoChange = (value: string) => {
    setProjectNo(value)
    setOperation('')
    setMachineEquipmentId(undefined)
  }

  const handleProjectNoScanResolved = (payload: ScannedProjectPayload) => {
    setScannedProjectDataMap(prev => ({
      ...prev,
      [payload.projectNo]: {
        project_no: payload.projectNo,
        product_model: payload.productModel,
        length_mm: payload.lengthMm,
        material_code: payload.materialCode,
        customer_model: payload.customerModel,
      },
    }))

    handleProjectNoChange(payload.projectNo)
  }

  useEffect(() => {
    if (!scannedProjectFromNavigation) {
      return
    }

    if (appliedScanRef.current === scannedProjectFromNavigation.rawValue) {
      return
    }

    appliedScanRef.current = scannedProjectFromNavigation.rawValue

    setScannedProjectDataMap(prev => ({
      ...prev,
      [scannedProjectFromNavigation.projectNo]: {
        project_no: scannedProjectFromNavigation.projectNo,
        product_model: scannedProjectFromNavigation.productModel,
        length_mm: scannedProjectFromNavigation.lengthMm,
        material_code: scannedProjectFromNavigation.materialCode,
        customer_model: scannedProjectFromNavigation.customerModel,
      },
    }))

    setProjectNo(scannedProjectFromNavigation.projectNo)
    setOperation('')
    setMachineEquipmentId(undefined)
  }, [
    scannedProjectFromNavigation,
    setMachineEquipmentId,
    setOperation,
    setProjectNo,
  ])

  useEffect(() => {
    if (!editingItem) {
      return
    }

    setScannedProjectDataMap(prev => ({
      ...prev,
      [editingItem.project_no]: {
        project_no: editingItem.project_no,
        product_model: editingItem.product_model,
        length_mm: editingItem.length_mm,
        customer_model: editingItem.customer_model,
      },
    }))

    setProjectNo(editingItem.project_no)
    setOperation(editingItem.operation)
    // null 表示原明细选择了「无」，原样带入；undefined 才表示未选择
    setMachineEquipmentId(editingItem.machine_equipment_id)
    setIncomingQualifiedQuantity(editingItem.incoming_qualified_quantity || 0)
    setQualifiedQuantity(editingItem.qualified_quantity || 0)
    setDefectQuantity1(editingItem.defect_quantity_1 || 0)
    setDefectQuantity2(editingItem.defect_quantity_2 || 0)
    setOutsourceDefectQuantity(editingItem.outsource_defect_quantity || 0)
    setOutsourceDefectReason(editingItem.outsource_defect_reason || '')
    setOutsourceUnit(editingItem.outsource_unit || '')
    setSetupDefectQuantity(editingItem.setup_defect_quantity || 0)
    setSetupResponsible(editingItem.setup_responsible || '')
    setRemark(editingItem.remark || '')
  }, [
    editingItem,
    setDefectQuantity1,
    setDefectQuantity2,
    setIncomingQualifiedQuantity,
    setMachineEquipmentId,
    setOperation,
    setOutsourceDefectQuantity,
    setOutsourceDefectReason,
    setOutsourceUnit,
    setProjectNo,
    setQualifiedQuantity,
    setRemark,
    setSetupDefectQuantity,
    setSetupResponsible,
  ])

  if (!isEmployeeView || !employeeId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          <Title level={4}>当前账号不可使用扫码录入</Title>
          <Paragraph type="secondary">
            请使用员工端账号进入后再尝试录入工单。
          </Paragraph>
          <Button type="primary" onClick={() => navigate(returnTo)}>
            返回我的工单
          </Button>
        </Card>
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!projectNo) {
      message.error('请选择项目号')
      return
    }

    if (!operation) {
      message.error('请选择工序')
      return
    }

    if (machineEquipmentId === undefined) {
      message.error('请选择机器编号')
      return
    }

    const minimumIncomingQuantity
      = qualifiedQuantity
        + defectQuantity1
        + defectQuantity2
        + outsourceDefectQuantity
        + setupDefectQuantity

    if (incomingQualifiedQuantity < minimumIncomingQuantity) {
      message.error('来料接收数不能小于成品合格数与不良数之和')
      return
    }

    setIsSubmitting(true)

    try {
      const itemPayload = {
        project_no: projectNo,
        product_model: currentProject?.product_model || null,
        length_mm: currentProject?.length_mm || null,
        customer_model: currentProject?.customer_model || null,
        data_category: 'A' as const,
        operation,
        standard_seconds: Number(
          selectedOperationRecord?.standard_seconds || 0,
        ),
        theoretical_seconds: Number(
          selectedOperationRecord?.theoretical_seconds || 0,
        ),
        machine_equipment_id: machineEquipmentId,
        incoming_qualified_quantity: Number(incomingQualifiedQuantity || 0),
        qualified_quantity: Number(qualifiedQuantity || 0),
        defect_reason_1: '加工',
        defect_quantity_1: Number(defectQuantity1 || 0),
        defect_reason_2: '原料',
        defect_quantity_2: Number(defectQuantity2 || 0),
        outsource_defect_quantity: Number(outsourceDefectQuantity || 0),
        outsource_defect_reason: outsourceDefectReason.trim() || null,
        outsource_unit: outsourceUnit.trim() || null,
        setup_defect_quantity: Number(setupDefectQuantity || 0),
        setup_responsible: setupResponsible.trim() || null,
        remark: remark.trim() || null,
      }

      let createdNewOrder = false

      if (editingItem?.id) {
        await updateProductionOrderItem({
          id: editingItem.id,
          values: itemPayload,
        })
      }
      else {
        let orderId = targetOrderId

        if (!orderId) {
          const orderDate = dayjs().format('YYYY-MM-DD')
          let order = await getEmployeeOrderByDate(employeeId, orderDate)

          if (!order) {
            try {
              createdNewOrder = true
              order = await createProductionOrder({
                employee_id: employeeId,
                order_date: orderDate,
                work_hours: 0,
                shift: '白班',
                remark: null,
                extra_qualified_hours: 0,
              })
            }
            catch (error) {
              if (
                error instanceof Error
                && error.message.includes('同一天只能创建一张工单')
              ) {
                createdNewOrder = false
                order = await getEmployeeOrderByDate(employeeId, orderDate)
              }
              else {
                throw error
              }
            }
          }

          if (!order) {
            throw new Error('获取当天工单失败，请稍后重试')
          }

          orderId = order.id
        }

        await addProductionOrderItem({
          order_id: orderId,
          ...itemPayload,
        })
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['production-orders'] }),
        queryClient.invalidateQueries({ queryKey: ['production-order-items'] }),
        queryClient.invalidateQueries({
          queryKey: ['production-orders-today-check'],
        }),
      ])

      message.success(
        editingItem?.id
          ? '工序明细已更新'
          : createdNewOrder
            ? '新工单已创建，并写入工序明细'
            : isExistingOrderMode
              ? '工序明细已写入当前工单'
              : '当天已存在工单，工序明细已追加到原工单',
      )

      resetForm()
      navigate(returnTo)
    }
    catch (error) {
      message.error(
        error instanceof Error ? error.message : '提交失败，请稍后重试',
      )
    }
    finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 pb-[calc(--spacing(16)+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <MobileProductionOrderScanHeader
          isEditMode={isEditMode}
          isExistingOrderMode={isExistingOrderMode}
          projectNos={projectNos}
          employeeName={employeeName}
          handleProjectNoScanResolved={handleProjectNoScanResolved}
        />

        <section className="rounded-[30px] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-slate-700/80 dark:bg-slate-900/90">
          <div className="flex flex-col gap-5">
            {/* 基本信息 */}
            <MobileProductionOrderScanBasicInfo
              projectNo={projectNo}
              operation={operation}
              currentProject={currentProject}
              currentProductModel={currentProductModel}
              operationMatch={operationMatch}
              currentMachineLabel={currentMachineLabel}
              setActiveSheet={setActiveSheet}
            />

            <MobileProductionOrderScanQuantitySections form={scanForm} />
          </div>
        </section>
      </div>

      <div
        className="fixed inset-x-0 z-40 border-t border-white/70 bg-white/92 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 82px)' }}
      >
        <div className="mx-auto grid max-w-2xl grid-cols-[1fr_1.4fr] gap-3">
          <Button
            className="h-12 rounded-2xl"
            onClick={() => navigate(returnTo)}
          >
            取消
          </Button>
          <Button
            type="primary"
            className="h-12 rounded-2xl"
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {isEditMode ? '保存工序明细' : '提交工序明细'}
          </Button>
        </div>
      </div>

      <MobileBottomSelectSheet
        open={activeSheet === 'project'}
        title="选择项目号"
        options={projectOptions}
        value={projectNo || null}
        searchPlaceholder="搜索项目号、型号、长度、客户型号"
        emptyText="暂无项目号数据"
        onClose={() => setActiveSheet(null)}
        onSelect={handleProjectNoChange}
      />

      <MobileBottomSelectSheet
        open={activeSheet === 'operation'}
        title="选择工序"
        options={operationOptions}
        value={operation || null}
        searchPlaceholder="搜索工序名称"
        emptyText={
          currentProductModel ? '当前项目号暂无可用工序' : '请先选择项目号'
        }
        onClose={() => setActiveSheet(null)}
        onSelect={(value) => {
          setOperation(value)
          setMachineEquipmentId(undefined)
        }}
      />

      <MobileBottomSelectSheet
        open={activeSheet === 'machine'}
        title="选择机器编号"
        options={machineSelectOptions}
        value={machineEquipmentId ?? '__none__'}
        searchPlaceholder="搜索机器编号、工序、机器名称"
        emptyText="暂无机器编号选项"
        onClose={() => setActiveSheet(null)}
        onSelect={(value) => {
          setMachineEquipmentId(value === '__none__' ? null : value)
        }}
      />
    </div>
  )
}
