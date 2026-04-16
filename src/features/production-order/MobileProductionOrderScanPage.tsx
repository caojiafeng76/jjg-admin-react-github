import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Card, Input, InputNumber, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/useAuth'
import { isEmployeeSideRole } from '@/config/access'
import {
  createProductionOrder,
  getEmployeeOrderByDate,
} from '@/services/apiProductionOrders'
import {
  addProductionOrderItem,
  updateProductionOrderItem,
  type ProductionOrderItem,
} from '@/services/apiProductionOrderItems'
import {
  useSalesOrdersProjectNos,
  useOperationsByModel,
} from './useProcessStandards'
import { useMachineEquipmentOptions } from './useMachineEquipmentOptions'
import ProjectNoScanButton, {
  type ScannedProjectPayload,
} from './ProjectNoScanButton'
import MobileBottomSelectSheet, {
  type MobileBottomSelectOption,
} from '@/ui/mobile/MobileBottomSelectSheet'

const { Paragraph, Text, Title } = Typography

type ActiveSheet = 'project' | 'operation' | 'machine' | null

interface ProjectNoData {
  project_no: string
  product_model: string | null
  length_mm: number | null
  material_code?: string | null
  customer_model: string | null
}

interface ScanPageLocationState {
  scannedProject?: ScannedProjectPayload
  returnTo?: string
  orderId?: string
  editingItem?: ProductionOrderItem
}

function formatDisplayValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '未填写'
  }

  return String(value)
}

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
  const [projectNo, setProjectNo] = useState<string>('')
  const [operation, setOperation] = useState<string>('')
  const [machineEquipmentId, setMachineEquipmentId] = useState<
    string | null | undefined
  >(undefined)
  const [incomingQualifiedQuantity, setIncomingQualifiedQuantity] =
    useState<number>(0)
  const [qualifiedQuantity, setQualifiedQuantity] = useState<number>(0)
  const [defectQuantity1, setDefectQuantity1] = useState<number>(0)
  const [defectQuantity2, setDefectQuantity2] = useState<number>(0)
  const [outsourceDefectQuantity, setOutsourceDefectQuantity] =
    useState<number>(0)
  const [outsourceDefectReason, setOutsourceDefectReason] = useState('')
  const [outsourceUnit, setOutsourceUnit] = useState('')
  const [setupDefectQuantity, setSetupDefectQuantity] = useState<number>(0)
  const [setupResponsible, setSetupResponsible] = useState('')
  const [remark, setRemark] = useState('')
  const [scannedProjectDataMap, setScannedProjectDataMap] = useState<
    Record<string, ProjectNoData>
  >({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const appliedScanRef = useRef<string | null>(null)

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
    (item) => item.operation === operation,
  )

  const projectOptions = useMemo<MobileBottomSelectOption[]>(() => {
    return Array.from(projectInfoMap.values()).map((item) => ({
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
    return operationRecords.map((item) => ({
      value: item.operation,
      label: item.operation,
      keywords: [
        item.operation,
        item.record_type || '',
        item.part_no || '',
      ].join(' '),
      description: (
        <div className="flex items-center justify-between gap-3">
          <span>
            标准工时: {Number(item.standard_seconds || 0).toFixed(2)} 秒
          </span>
          <span>
            理论工时: {Number(item.theoretical_seconds || 0).toFixed(2)} 秒
          </span>
        </div>
      ),
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
      ...((machineOptions || []).map((item) => ({
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
      machineOptions?.find((item) => item.id === machineEquipmentId)
        ?.unified_device_no || '请选择机器编号'
    )
  }, [machineEquipmentId, machineOptions])

  const navigationState = location.state as ScanPageLocationState | null
  const scannedProjectFromNavigation = navigationState?.scannedProject
  const returnTo = navigationState?.returnTo || '/production-order'
  const targetOrderId = navigationState?.orderId
  const editingItem = navigationState?.editingItem
  const isEditMode = Boolean(editingItem?.id)
  const isExistingOrderMode = Boolean(targetOrderId)

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

  const handleProjectNoChange = (value: string) => {
    setProjectNo(value)
    setOperation('')
    setMachineEquipmentId(undefined)
  }

  const handleProjectNoScanResolved = (payload: ScannedProjectPayload) => {
    setScannedProjectDataMap((prev) => ({
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

    setScannedProjectDataMap((prev) => ({
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
  }, [scannedProjectFromNavigation])

  useEffect(() => {
    if (!editingItem) {
      return
    }

    setScannedProjectDataMap((prev) => ({
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
    setMachineEquipmentId(editingItem.machine_equipment_id ?? undefined)
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
  }, [editingItem])

  if (!isEmployeeView || !employeeId) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
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

    const minimumIncomingQuantity =
      qualifiedQuantity +
      defectQuantity1 +
      defectQuantity2 +
      outsourceDefectQuantity +
      setupDefectQuantity

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
      } else {
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
            } catch (error) {
              if (
                error instanceof Error &&
                error.message.includes('同一天只能创建一张工单')
              ) {
                createdNewOrder = false
                order = await getEmployeeOrderByDate(employeeId, orderDate)
              } else {
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
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '提交失败，请稍后重试',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto px-3 pt-3 pb-52">
      <div className="mx-auto max-w-2xl space-y-3">
        <section className="rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.24em] text-slate-400 uppercase">
                Scan To Add
              </div>
              <Title level={4} style={{ marginTop: 8, marginBottom: 4 }}>
                {isEditMode
                  ? '编辑工序明细'
                  : isExistingOrderMode
                    ? '新增工序明细'
                    : '扫码添加工单'}
              </Title>
              <Text type="secondary">
                {isEditMode
                  ? '在独立页面中修改工序明细，提交后返回原工单。'
                  : isExistingOrderMode
                    ? '为当前工单新增工序明细，提交后返回详情页。'
                    : '扫描项目号后直接录入工序明细；若当天已有工单，则自动追加到当天工单，否则创建新工单。'}
              </Text>
            </div>

            <ProjectNoScanButton
              projectNos={projectNos}
              onResolved={handleProjectNoScanResolved}
            />
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>当前录入日期</span>
              <span className="font-semibold text-slate-900">
                {dayjs().format('YYYY-MM-DD')}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span>录入员工</span>
              <span className="font-semibold text-slate-900">
                {employeeName}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">
                项目号
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet('project')}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
              >
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    {projectNo || '请选择项目号'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    可扫码自动带出，也可手动修改
                  </div>
                </div>
                <span className="text-slate-400">选择</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-xs text-slate-400">型号</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDisplayValue(currentProject?.product_model)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-xs text-slate-400">长度(mm)</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDisplayValue(currentProject?.length_mm)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="text-xs text-slate-400">客户型号</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDisplayValue(currentProject?.customer_model)}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
                <span>工序</span>
                {operationMatch?.matchLevel ? (
                  <Tag
                    color={
                      operationMatch.matchLevel === 'type-a'
                        ? 'success'
                        : 'processing'
                    }
                  >
                    {operationMatch.matchLevel === 'type-a'
                      ? 'A类匹配'
                      : 'B类匹配'}
                  </Tag>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet('operation')}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
                disabled={!currentProductModel}
              >
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    {operation || '请选择工序'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {currentProductModel
                      ? '根据项目号自动匹配工序列表'
                      : '请先确定项目号'}
                  </div>
                </div>
                <span className="text-slate-400">选择</span>
              </button>
              {selectedOperationRecord ? (
                <div className="mt-2 text-xs text-slate-500">
                  标准工时{' '}
                  {Number(
                    selectedOperationRecord.standard_seconds || 0,
                  ).toFixed(2)}{' '}
                  秒， 理论工时{' '}
                  {Number(
                    selectedOperationRecord.theoretical_seconds || 0,
                  ).toFixed(2)}{' '}
                  秒
                </div>
              ) : null}
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">
                机器编号
              </div>
              <button
                type="button"
                onClick={() => setActiveSheet('machine')}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
                disabled={!operation}
              >
                <div>
                  <div className="text-base font-semibold text-slate-900">
                    {currentMachineLabel}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {operation ? '从底部弹层中选择机器编号' : '请先选择工序'}
                  </div>
                </div>
                <span className="text-slate-400">选择</span>
              </button>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">
                来料接收数
              </div>
              <InputNumber
                min={0}
                value={incomingQualifiedQuantity}
                onChange={(value) =>
                  setIncomingQualifiedQuantity(Number(value || 0))
                }
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">
                成品合格数
              </div>
              <InputNumber
                min={0}
                value={qualifiedQuantity}
                onChange={(value) => setQualifiedQuantity(Number(value || 0))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  加工不良数量
                </div>
                <InputNumber
                  min={0}
                  value={defectQuantity1}
                  onChange={(value) => setDefectQuantity1(Number(value || 0))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  原料不良数量
                </div>
                <InputNumber
                  min={0}
                  value={defectQuantity2}
                  onChange={(value) => setDefectQuantity2(Number(value || 0))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  调机不良
                </div>
                <InputNumber
                  min={0}
                  value={setupDefectQuantity}
                  onChange={(value) =>
                    setSetupDefectQuantity(Number(value || 0))
                  }
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-red-300 bg-red-50/60 p-4">
              <div className="mb-3 text-sm font-medium text-red-600">
                外协相关信息
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-700">
                    外协不良数
                  </div>
                  <InputNumber
                    min={0}
                    value={outsourceDefectQuantity}
                    onChange={(value) =>
                      setOutsourceDefectQuantity(Number(value || 0))
                    }
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-700">
                    外协单位
                  </div>
                  <Input
                    value={outsourceUnit}
                    onChange={(event) => setOutsourceUnit(event.target.value)}
                    placeholder="请输入外协单位"
                  />
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-2 text-sm font-semibold text-slate-700">
                  外协不良原因
                </div>
                <Input.TextArea
                  rows={2}
                  value={outsourceDefectReason}
                  onChange={(event) =>
                    setOutsourceDefectReason(event.target.value)
                  }
                  placeholder="请输入外协不良原因"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">
                调机负责人
              </div>
              <Input
                value={setupResponsible}
                onChange={(event) => setSetupResponsible(event.target.value)}
                placeholder="请输入调机负责人"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-700">
                备注
              </div>
              <Input.TextArea
                rows={3}
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="如有需要可补充说明"
              />
            </div>
          </div>
        </section>
      </div>

      <div
        className="fixed inset-x-0 z-40 border-t border-white/70 bg-white/92 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-xl"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 82px)' }}
      >
        <div className="mx-auto flex max-w-2xl gap-3">
          <Button
            className="h-12 flex-1 rounded-2xl"
            onClick={() => navigate(returnTo)}
          >
            取消
          </Button>
          <Button
            type="primary"
            className="h-12 flex-[1.4] rounded-2xl"
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
