import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { App, Button, Card, Form, Input, InputNumber, Typography } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'

import { isEmployeeSideRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import ProjectNoScanButton, {
  type ScannedProjectPayload,
} from '@/features/production-order/ProjectNoScanButton'
import { useSalesOrdersProjectNos } from '@/features/production-order/useProcessStandards'
import { useAllEmployees } from '@/features/workshop/EmployeeList/useEmployees'
import MobileBottomSelectSheet, {
  type MobileBottomSelectOption,
} from '@/ui/mobile/MobileBottomSelectSheet'
import MobileProjectSummaryCard from '@/ui/mobile/MobileProjectSummaryCard'
import MobileScanPageShell from '@/ui/mobile/MobileScanPageShell'
import {
  PRECISION_FINISHING_CUTTING_RECIPIENTS,
  PRECISION_FINISHING_CUTTING_WORKSHOPS,
  type PrecisionFinishingCuttingInsert,
  type PrecisionFinishingCuttingUpdate,
  type PrecisionFinishingCuttingWithEmployee,
} from '@/services/apiPrecisionFinishingCuttings'
import { translateErrorMessage } from '@/utils/errorHandler'
import {
  useCreatePrecisionFinishingCutting,
  useUpdatePrecisionFinishingCutting,
} from './usePrecisionFinishingCuttings'

const { Paragraph, Title } = Typography
const DEFAULT_INSPECTOR_NAME = '崔路路'

type ActiveSheet = 'project' | 'operator' | 'workshop' | 'recipient' | null

interface PrecisionFinishingCuttingScanFormValues {
  project_no: string
  customer?: string
  product_model?: string
  length_mm?: number
  customer_model?: string
  long_material_length_mm: number
  long_material_quantity: number
  raw_material_defect_count: number
  processing_defect_count: number
  outsource_defect_quantity?: number
  defect_reason?: string
  outsource_defect_reason?: string
  outsource_unit?: string
  transfer_quantity: number
  responsible_process?: string
  process_owner?: string
  operator_employee_id?: string
  target_workshop?: string
  recipient_name?: string
  inspector_name?: string
  remark?: string
}

interface ProjectNoData {
  project_no: string
  customer: string | null
  product_model: string | null
  length_mm: number | null
  customer_model: string | null
}

interface ScanPageLocationState {
  scannedProject?: ScannedProjectPayload
  autoOpenScanner?: boolean
  returnTo?: string
  editingRecord?: PrecisionFinishingCuttingWithEmployee
}

export default function MobilePrecisionFinishingCuttingScanPage() {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const { role, employeeProfile, user } = useAuth()
  const isEmployeeView = isEmployeeSideRole(role)
  const isOwnOnlyView = role === 'employee'
  const currentUploader = employeeProfile?.name || user?.email || null
  const fixedEmployee = useMemo(
    () =>
      isOwnOnlyView && employeeProfile?.id
        ? { id: employeeProfile.id, name: employeeProfile.name }
        : null,
    [employeeProfile, isOwnOnlyView],
  )
  const { data: projectNos } = useSalesOrdersProjectNos()
  const { data: employeeOptions = [] } = useAllEmployees(!isOwnOnlyView)
  const createMutation = useCreatePrecisionFinishingCutting()
  const updateMutation = useUpdatePrecisionFinishingCutting()
  const [form] = Form.useForm<PrecisionFinishingCuttingScanFormValues>()
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null)
  const [scannedProjectDataMap, setScannedProjectDataMap] = useState<
    Record<string, ProjectNoData>
  >({})
  const appliedScanRef = useRef<string | null>(null)

  const navigationState = location.state as ScanPageLocationState | null
  const scannedProjectFromNavigation = navigationState?.scannedProject
  const autoOpenScanner = Boolean(navigationState?.autoOpenScanner)
  const returnTo = navigationState?.returnTo || '/precision-finishing-cutting'
  const editingRecord = navigationState?.editingRecord || null
  const isEditMode = Boolean(editingRecord?.id)

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

  const employees = useMemo(
    () => (fixedEmployee ? [fixedEmployee] : employeeOptions),
    [employeeOptions, fixedEmployee],
  )

  const employeeNameMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee.name])),
    [employees],
  )

  const projectNo = Form.useWatch('project_no', form) || ''
  const operatorEmployeeId = Form.useWatch('operator_employee_id', form)
  const targetWorkshop = Form.useWatch('target_workshop', form)
  const recipientName = Form.useWatch('recipient_name', form)
  const currentProject = projectNo ? projectInfoMap.get(projectNo) : undefined

  const projectOptions = useMemo<MobileBottomSelectOption[]>(() => {
    return Array.from(projectInfoMap.values()).map((item) => ({
      value: item.project_no,
      label: item.project_no,
      keywords: [
        item.project_no,
        item.customer || '',
        item.product_model || '',
        item.customer_model || '',
        item.length_mm || '',
      ].join(' '),
      description: (
        <div className="grid grid-cols-2 gap-2">
          <span className="truncate">客户: {item.customer || '-'}</span>
          <span className="truncate">型号: {item.product_model || '-'}</span>
          <span className="truncate">长度: {item.length_mm ?? '-'}</span>
          <span className="truncate">
            客户型号: {item.customer_model || '-'}
          </span>
        </div>
      ),
    }))
  }, [projectInfoMap])

  const operatorOptions = useMemo<MobileBottomSelectOption[]>(() => {
    return employees.map((employee) => ({
      value: employee.id,
      label: employee.name,
      keywords: `${employee.name} ${employee.id}`,
    }))
  }, [employees])

  const workshopOptions = useMemo<MobileBottomSelectOption[]>(() => {
    return PRECISION_FINISHING_CUTTING_WORKSHOPS.map((workshop) => ({
      value: workshop,
      label: workshop,
    }))
  }, [])

  const recipientOptions = useMemo<MobileBottomSelectOption[]>(() => {
    return PRECISION_FINISHING_CUTTING_RECIPIENTS.map((recipient) => ({
      value: recipient,
      label: recipient,
    }))
  }, [])

  const currentOperatorLabel = useMemo(() => {
    if (fixedEmployee) {
      return fixedEmployee.name
    }

    if (!operatorEmployeeId) {
      return '请选择操作人'
    }

    return employeeNameMap.get(operatorEmployeeId) || '请选择操作人'
  }, [employeeNameMap, fixedEmployee, operatorEmployeeId])

  const handleProjectResolved = useCallback((payload: ScannedProjectPayload) => {
    setScannedProjectDataMap((prev) => ({
      ...prev,
      [payload.projectNo]: {
        project_no: payload.projectNo,
        customer: payload.customer,
        product_model: payload.productModel,
        length_mm: payload.lengthMm,
        customer_model: payload.customerModel,
      },
    }))

    form.setFieldsValue({
      project_no: payload.projectNo,
      customer: payload.customer || undefined,
      product_model: payload.productModel || undefined,
      length_mm: payload.lengthMm ?? undefined,
      customer_model: payload.customerModel || undefined,
    })
  }, [form])

  const handleProjectChange = (value: string) => {
    const selectedProject = projectInfoMap.get(value)

    form.setFieldsValue({
      project_no: value,
      customer: selectedProject?.customer || undefined,
      product_model: selectedProject?.product_model || undefined,
      length_mm: selectedProject?.length_mm ?? undefined,
      customer_model: selectedProject?.customer_model || undefined,
    })
  }

  useEffect(() => {
    if (editingRecord) {
      setScannedProjectDataMap((prev) => ({
        ...prev,
        [editingRecord.project_no]: {
          project_no: editingRecord.project_no,
          customer: editingRecord.customer,
          product_model: editingRecord.product_model,
          length_mm: editingRecord.length_mm,
          customer_model: editingRecord.customer_model,
        },
      }))
      form.setFieldsValue({
        project_no: editingRecord.project_no,
        customer: editingRecord.customer || undefined,
        product_model: editingRecord.product_model || undefined,
        length_mm: editingRecord.length_mm ?? undefined,
        customer_model: editingRecord.customer_model || undefined,
        long_material_length_mm: editingRecord.long_material_length_mm,
        long_material_quantity: editingRecord.long_material_quantity,
        raw_material_defect_count: editingRecord.raw_material_defect_count,
        processing_defect_count: editingRecord.processing_defect_count,
        outsource_defect_quantity: editingRecord.outsource_defect_quantity,
        defect_reason: editingRecord.defect_reason || undefined,
        outsource_defect_reason:
          editingRecord.outsource_defect_reason || undefined,
        outsource_unit: editingRecord.outsource_unit || undefined,
        transfer_quantity: editingRecord.transfer_quantity,
        responsible_process: editingRecord.responsible_process || undefined,
        process_owner: editingRecord.process_owner || undefined,
        operator_employee_id:
          editingRecord.operator_employee_ids[0] || fixedEmployee?.id,
        target_workshop: editingRecord.target_workshop,
        recipient_name: editingRecord.recipient_name,
        inspector_name: editingRecord.inspector_name || undefined,
        remark: editingRecord.remark || undefined,
      })
      return
    }

    form.setFieldsValue({
      long_material_length_mm: 0.01,
      long_material_quantity: 1,
      raw_material_defect_count: 0,
      processing_defect_count: 0,
      outsource_defect_quantity: 0,
      transfer_quantity: 1,
      operator_employee_id: fixedEmployee?.id || undefined,
      inspector_name: DEFAULT_INSPECTOR_NAME,
    })
  }, [editingRecord, fixedEmployee?.id, form])

  useEffect(() => {
    if (!scannedProjectFromNavigation) {
      return
    }

    if (appliedScanRef.current === scannedProjectFromNavigation.rawValue) {
      return
    }

    appliedScanRef.current = scannedProjectFromNavigation.rawValue
    handleProjectResolved(scannedProjectFromNavigation)
  }, [handleProjectResolved, scannedProjectFromNavigation])

  const handleSubmit = async (
    values: PrecisionFinishingCuttingScanFormValues,
  ) => {
    const selectedOperatorId = fixedEmployee?.id || values.operator_employee_id

    if (!selectedOperatorId) {
      message.error('请选择操作人')
      return
    }

    const selectedOperatorName = employeeNameMap.get(selectedOperatorId)

    if (!selectedOperatorName) {
      message.error('操作人信息无效，请重新选择')
      return
    }

    const payload: PrecisionFinishingCuttingInsert = {
      project_no: values.project_no,
      customer: values.customer || null,
      product_model: values.product_model || null,
      length_mm: values.length_mm ?? null,
      customer_model: values.customer_model || null,
      long_material_length_mm: values.long_material_length_mm,
      long_material_quantity: values.long_material_quantity,
      raw_material_defect_count: values.raw_material_defect_count,
      processing_defect_count: values.processing_defect_count,
      outsource_defect_quantity: values.outsource_defect_quantity ?? 0,
      defect_reason: values.defect_reason || null,
      outsource_defect_reason: values.outsource_defect_reason || null,
      outsource_unit: values.outsource_unit || null,
      transfer_quantity: values.transfer_quantity,
      responsible_process: values.responsible_process || null,
      process_owner: values.process_owner || null,
      operator_employee_id: selectedOperatorId,
      operator_employee_ids: [selectedOperatorId],
      operator_names: [selectedOperatorName],
      target_workshop: values.target_workshop || '',
      recipient_name: values.recipient_name || '',
      inspector_name: values.inspector_name || null,
      uploaded_by_name: currentUploader,
      remark: values.remark || null,
      is_audited: false,
    }

    try {
      if (editingRecord) {
        const updateValues: PrecisionFinishingCuttingUpdate = {
          ...payload,
          uploaded_by_name: editingRecord.uploaded_by_name,
          is_audited: false,
        }
        await updateMutation.mutateAsync({
          id: editingRecord.id,
          values: updateValues,
        })
        message.success('精加工切割单更新成功')
      } else {
        await createMutation.mutateAsync(payload)
        message.success('精加工切割单创建成功')
      }

      navigate(returnTo)
    } catch (error) {
      message.error(
        error instanceof Error
          ? translateErrorMessage(error.message)
          : isEditMode
            ? '精加工切割单更新失败'
            : '精加工切割单创建失败',
      )
    }
  }

  if (!isEmployeeView || !employeeProfile?.id) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <Title level={4}>当前账号不可使用扫码录入</Title>
          <Paragraph type="secondary">
            请使用员工端账号进入后再尝试录入精加工切割单。
          </Paragraph>
          <Button
            type="primary"
            onClick={() => navigate(returnTo)}
          >
            返回精加工切割单
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <>
      <ProjectNoScanButton
        projectNos={projectNos}
        autoOpen={autoOpenScanner}
        onResolved={handleProjectResolved}
        renderTrigger={() => null}
      />

      <MobileScanPageShell
        eyebrow="Precision Finishing Scan"
        title={isEditMode ? '编辑精加工切割单' : '扫码精加工切割单'}
        description={
          isEditMode
            ? '在独立页面中修改精加工切割单，提交后返回列表。'
            : '扫码后自动带出项目信息，员工端在当前页面直接完成精加工切割单录入。'
        }
        scanTrigger={null}
        summary={
          <MobileProjectSummaryCard
            project={currentProject}
            emptyDescription="进入页面后会直接拉起扫码；若未识别成功，也可手动选择项目号继续录入。"
          />
        }
        content={
          <Card className="rounded-4xl border-slate-200 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="space-y-1"
            >
              <Form.Item
                name="project_no"
                label="项目号"
                rules={[{ required: true, message: '请选择项目号' }]}
              >
                <button
                  type="button"
                  onClick={() => setActiveSheet('project')}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900"
                >
                  {projectNo || '请选择项目号'}
                </button>
              </Form.Item>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item name="customer" label="客户">
                  <Input disabled placeholder="自动带出" />
                </Form.Item>
                <Form.Item name="product_model" label="型号">
                  <Input disabled placeholder="自动带出" />
                </Form.Item>
                <Form.Item name="length_mm" label="长度(mm)">
                  <InputNumber
                    disabled
                    className="w-full"
                    placeholder="自动带出"
                  />
                </Form.Item>
                <Form.Item name="customer_model" label="客户型号">
                  <Input disabled placeholder="自动带出" />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="long_material_length_mm"
                  label="长料长度(mm)"
                  rules={[{ required: true, message: '请输入长料长度' }]}
                >
                  <InputNumber min={0.01} precision={2} className="w-full" />
                </Form.Item>
                <Form.Item
                  name="long_material_quantity"
                  label="长料数量"
                  rules={[{ required: true, message: '请输入长料数量' }]}
                >
                  <InputNumber min={1} precision={0} className="w-full" />
                </Form.Item>
                <Form.Item
                  name="raw_material_defect_count"
                  label="原料不良数"
                  rules={[{ required: true, message: '请输入原料不良数' }]}
                >
                  <InputNumber min={0} precision={0} className="w-full" />
                </Form.Item>
                <Form.Item
                  name="processing_defect_count"
                  label="加工不良数"
                  rules={[{ required: true, message: '请输入加工不良数' }]}
                >
                  <InputNumber min={0} precision={0} className="w-full" />
                </Form.Item>
                <Form.Item name="outsource_defect_quantity" label="外协不良数">
                  <InputNumber min={0} precision={0} className="w-full" />
                </Form.Item>
                <Form.Item
                  name="transfer_quantity"
                  label="转移数量"
                  rules={[{ required: true, message: '请输入转移数量' }]}
                >
                  <InputNumber min={1} precision={0} className="w-full" />
                </Form.Item>
              </div>

              <Form.Item name="defect_reason" label="不良原因">
                <Input.TextArea rows={2} placeholder="可填写不良原因" />
              </Form.Item>

              <Form.Item name="outsource_defect_reason" label="外协不良原因">
                <Input.TextArea rows={2} placeholder="可填写外协不良原因" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item name="outsource_unit" label="外协单位">
                  <Input placeholder="请输入外协单位" />
                </Form.Item>
                <Form.Item name="responsible_process" label="责任工序">
                  <Input placeholder="请输入责任工序" />
                </Form.Item>
                <Form.Item name="process_owner" label="工序负责人">
                  <Input placeholder="请输入工序负责人" />
                </Form.Item>
                <Form.Item
                  name="operator_employee_id"
                  label="操作人"
                  rules={[{ required: true, message: '请选择操作人' }]}
                >
                  <button
                    type="button"
                    disabled={Boolean(fixedEmployee)}
                    onClick={() => setActiveSheet('operator')}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {currentOperatorLabel}
                  </button>
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item
                  name="target_workshop"
                  label="接收车间"
                  rules={[{ required: true, message: '请选择接收车间' }]}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSheet('workshop')}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900"
                  >
                    {targetWorkshop || '请选择接收车间'}
                  </button>
                </Form.Item>

                <Form.Item
                  name="recipient_name"
                  label="接收人"
                  rules={[{ required: true, message: '请输入接收人' }]}
                >
                  <Input
                    placeholder="可手动输入"
                    addonAfter={
                      <button
                        type="button"
                        onClick={() => setActiveSheet('recipient')}
                        className="text-xs text-slate-600"
                      >
                        常用
                      </button>
                    }
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Form.Item name="inspector_name" label="检验人">
                  <Input placeholder="默认崔路路，可修改" />
                </Form.Item>
                <Form.Item name="remark" label="备注">
                  <Input.TextArea rows={2} placeholder="可填写切割说明" />
                </Form.Item>
              </div>
            </Form>
          </Card>
        }
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-11 rounded-2xl"
              onClick={() => navigate(returnTo)}
            >
              返回上一页
            </Button>
            <Button
              type="primary"
              className="h-11 rounded-2xl"
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={() => form.submit()}
            >
              {isEditMode ? '提交更新' : '提交创建'}
            </Button>
          </div>
        }
        secondaryAction={{
          label: '返回扫码导航',
          onClick: () => navigate('/scan'),
        }}
        primaryAction={{
          label: '返回精加工切割单',
          onClick: () => navigate(returnTo),
        }}
      />

      <MobileBottomSelectSheet
        open={activeSheet === 'project'}
        title="选择项目号"
        options={projectOptions}
        value={projectNo}
        onClose={() => setActiveSheet(null)}
        onSelect={handleProjectChange}
      />

      <MobileBottomSelectSheet
        open={activeSheet === 'operator'}
        title="选择操作人"
        options={operatorOptions}
        value={fixedEmployee?.id || operatorEmployeeId}
        onClose={() => setActiveSheet(null)}
        onSelect={(value) => {
          form.setFieldValue('operator_employee_id', value)
        }}
      />

      <MobileBottomSelectSheet
        open={activeSheet === 'workshop'}
        title="选择接收车间"
        options={workshopOptions}
        value={targetWorkshop}
        onClose={() => setActiveSheet(null)}
        onSelect={(value) => {
          form.setFieldValue('target_workshop', value)
        }}
      />

      <MobileBottomSelectSheet
        open={activeSheet === 'recipient'}
        title="选择接收人"
        options={recipientOptions}
        value={recipientName}
        onClose={() => setActiveSheet(null)}
        onSelect={(value) => {
          form.setFieldValue('recipient_name', value)
        }}
      />
    </>
  )
}
