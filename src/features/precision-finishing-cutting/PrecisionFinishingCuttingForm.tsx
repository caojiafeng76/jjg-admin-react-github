import { useEffect, useMemo } from 'react'
import {
  AutoComplete,
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
} from 'antd'

import {
  buildProjectNoSelectOptions,
  filterProjectNoOption,
  renderProjectNoOption,
} from '@/features/production-order/projectNoSelect'
import { useSalesOrdersProjectNos } from '@/features/production-order/useProcessStandards'
import {
  PRECISION_FINISHING_CUTTING_AUDIT_OPTIONS,
  PRECISION_FINISHING_CUTTING_RECIPIENTS,
  PRECISION_FINISHING_CUTTING_WORKSHOPS,
  type PrecisionFinishingCuttingInsert,
  type PrecisionFinishingCuttingUpdate,
  type PrecisionFinishingCuttingWithEmployee,
} from '@/services/apiPrecisionFinishingCuttings'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (
    values: PrecisionFinishingCuttingInsert | PrecisionFinishingCuttingUpdate,
  ) => Promise<void> | void
  initialValues?: PrecisionFinishingCuttingWithEmployee | null
  employees: { id: string; name: string }[]
  loading?: boolean
  fixedOperator?: { id: string; name: string } | null
  currentUploader?: string | null
  canAudit?: boolean
  mobile?: boolean
}

const DEFAULT_INSPECTOR_NAME = '崔路路'

type PrecisionFinishingCuttingFormValues = Omit<
  PrecisionFinishingCuttingInsert,
  'operator_employee_id' | 'operator_names'
>

export default function PrecisionFinishingCuttingForm({
  open,
  onCancel,
  onSubmit,
  initialValues,
  employees,
  loading = false,
  fixedOperator = null,
  currentUploader = null,
  canAudit = true,
  mobile = false,
}: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<PrecisionFinishingCuttingFormValues>()
  const { data: projectNos, isLoading: isLoadingProjectNos } =
    useSalesOrdersProjectNos()

  const employeeNameMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee.name])),
    [employees],
  )

  const recipientOptions = useMemo(
    () =>
      PRECISION_FINISHING_CUTTING_RECIPIENTS.map((name) => ({
        label: name,
        value: name,
      })),
    [],
  )

  const projectNoOptions = useMemo(
    () => buildProjectNoSelectOptions(projectNos),
    [projectNos],
  )

  const projectInfoMap = useMemo(() => {
    const map = new Map(
      (projectNos || []).map((item) => [item.project_no, item]),
    )

    return map
  }, [projectNos])

  useEffect(() => {
    if (!open) {
      return
    }

    if (initialValues) {
      form.setFieldsValue({
        project_no: initialValues.project_no,
        customer: initialValues.customer || undefined,
        product_model: initialValues.product_model || undefined,
        length_mm: initialValues.length_mm ?? undefined,
        customer_model: initialValues.customer_model || undefined,
        long_material_length_mm: initialValues.long_material_length_mm,
        long_material_quantity: initialValues.long_material_quantity,
        raw_material_defect_count: initialValues.raw_material_defect_count,
        processing_defect_count: initialValues.processing_defect_count,
        defect_reason: initialValues.defect_reason || undefined,
        transfer_quantity: initialValues.transfer_quantity,
        operator_employee_ids: initialValues.operator_employee_ids,
        target_workshop: initialValues.target_workshop,
        recipient_name: initialValues.recipient_name,
        inspector_name: initialValues.inspector_name || undefined,
        uploaded_by_name: initialValues.uploaded_by_name || undefined,
        remark: initialValues.remark || undefined,
        is_audited: initialValues.is_audited,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue({
      operator_employee_ids: fixedOperator?.id ? [fixedOperator.id] : undefined,
      inspector_name: DEFAULT_INSPECTOR_NAME,
      uploaded_by_name: currentUploader || undefined,
      is_audited: false,
      raw_material_defect_count: 0,
      processing_defect_count: 0,
    })
  }, [currentUploader, fixedOperator?.id, form, initialValues, open])

  function handleProjectChange(projectNo: string) {
    const selectedProject = projectInfoMap.get(projectNo)

    form.setFieldsValue({
      customer: selectedProject?.customer || undefined,
      product_model: selectedProject?.product_model || undefined,
      length_mm: selectedProject?.length_mm ?? undefined,
      customer_model: selectedProject?.customer_model || undefined,
    })
  }

  async function handleFinish(values: PrecisionFinishingCuttingFormValues) {
    if (!values.project_no?.trim()) {
      message.warning('请选择项目号')
      return
    }

    const operatorEmployeeIds = fixedOperator?.id
      ? [fixedOperator.id]
      : values.operator_employee_ids || []
    const operatorNames = operatorEmployeeIds
      .map((id) => employeeNameMap.get(id))
      .filter((name): name is string => Boolean(name))

    if (operatorEmployeeIds.length === 0) {
      message.warning('请选择至少一名操作人')
      return
    }

    await onSubmit({
      project_no: values.project_no,
      product_model: values.product_model || null,
      length_mm: values.length_mm ?? null,
      customer: values.customer || null,
      customer_model: values.customer_model || null,
      long_material_length_mm: values.long_material_length_mm,
      long_material_quantity: values.long_material_quantity,
      raw_material_defect_count: values.raw_material_defect_count,
      processing_defect_count: values.processing_defect_count,
      defect_reason: values.defect_reason || null,
      transfer_quantity: values.transfer_quantity,
      operator_employee_id: operatorEmployeeIds[0],
      operator_employee_ids: operatorEmployeeIds,
      operator_names: operatorNames,
      target_workshop: values.target_workshop,
      recipient_name: values.recipient_name,
      inspector_name: values.inspector_name || null,
      uploaded_by_name: currentUploader || values.uploaded_by_name || null,
      remark: values.remark || null,
      is_audited: canAudit ? (values.is_audited ?? false) : false,
    })
  }

  const getPopupContainer = (triggerNode: HTMLElement) =>
    triggerNode.parentElement || document.body

  return (
    <Modal
      title={initialValues ? '编辑精加工切割单' : '创建精加工切割单'}
      open={open}
      onCancel={onCancel}
      width={mobile ? 'calc(100vw - 24px)' : 860}
      style={mobile ? { top: 16, maxWidth: 520 } : undefined}
      footer={null}
      destroyOnHidden
    >
      <div
        className={
          mobile
            ? 'max-h-[calc(100vh-240px)] overflow-y-auto overscroll-contain pr-1'
            : undefined
        }
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="project_no"
            label="项目号"
            rules={[{ required: true, message: '请选择项目号' }]}
          >
            <Select
              showSearch
              placeholder="请选择项目号"
              loading={isLoadingProjectNos}
              getPopupContainer={getPopupContainer}
              options={projectNoOptions}
              filterOption={filterProjectNoOption}
              optionRender={renderProjectNoOption}
              listHeight={320}
              onChange={handleProjectChange}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="customer" label="客户">
              <Input disabled placeholder="自动带出" />
            </Form.Item>

            <Form.Item name="product_model" label="型号">
              <Input disabled placeholder="自动带出" />
            </Form.Item>

            <Form.Item name="length_mm" label="长度(mm)">
              <InputNumber disabled placeholder="自动带出" className="w-full" />
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

            <Form.Item name="defect_reason" label="不良原因" className="col-span-2">
              <Input.TextArea rows={2} placeholder="可填写不良原因" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="transfer_quantity"
              label="转移数量"
              rules={[{ required: true, message: '请输入转移数量' }]}
            >
              <InputNumber min={1} precision={0} className="w-full" />
            </Form.Item>

            <Form.Item
              name="operator_employee_ids"
              label="操作人"
              rules={[
                {
                  validator: async (_rule, value: string[] | undefined) => {
                    if (Array.isArray(value) && value.length > 0) {
                      return
                    }

                    throw new Error('请选择至少一名操作人')
                  },
                },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="请选择操作人"
                showSearch
                optionFilterProp="label"
                getPopupContainer={getPopupContainer}
                disabled={Boolean(fixedOperator)}
                options={employees.map((employee) => ({
                  label: employee.name,
                  value: employee.id,
                }))}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="target_workshop"
              label="接收车间"
              rules={[{ required: true, message: '请选择接收车间' }]}
            >
              <Select
                placeholder="请选择接收车间"
                getPopupContainer={getPopupContainer}
                options={PRECISION_FINISHING_CUTTING_WORKSHOPS.map((workshop) => ({
                  label: workshop,
                  value: workshop,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="recipient_name"
              label="接收人"
              rules={[{ required: true, message: '请输入接收人' }]}
            >
              <AutoComplete
                allowClear
                placeholder="可选择或手动填写"
                options={recipientOptions}
                filterOption
                getPopupContainer={getPopupContainer}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="inspector_name" label="检验人">
              <Input placeholder="默认崔路路，可修改" />
            </Form.Item>

            {mobile ? null : (
              <Form.Item name="uploaded_by_name" label="数据上传">
                <Input disabled placeholder="自动记录当前登录用户" />
              </Form.Item>
            )}
          </div>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="可填写切割说明" />
          </Form.Item>

          {canAudit ? (
            <Form.Item
              name="is_audited"
              label="审核状态"
              valuePropName="checked"
            >
              <Switch
                checkedChildren={PRECISION_FINISHING_CUTTING_AUDIT_OPTIONS[1].label}
                unCheckedChildren={PRECISION_FINISHING_CUTTING_AUDIT_OPTIONS[0].label}
              />
            </Form.Item>
          ) : null}

          <Form.Item className="mb-0">
            <Space className="flex justify-end">
              <Button onClick={onCancel}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {initialValues ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}