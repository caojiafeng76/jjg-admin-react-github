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
import {
  MATERIAL_TRANSFER_AUDIT_OPTIONS,
  MATERIAL_TRANSFER_RECIPIENTS,
  MATERIAL_TRANSFER_WORKSHOPS,
  type MaterialTransferInsert,
  type MaterialTransferUpdate,
  type MaterialTransferWithEmployee,
} from '@/services/apiMaterialTransfers'
import { useSalesOrdersProjectNos } from '@/features/production-order/useProcessStandards'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (
    values: MaterialTransferInsert | MaterialTransferUpdate,
  ) => Promise<void> | void
  initialValues?: MaterialTransferWithEmployee | null
  employees: { id: string; name: string }[]
  loading?: boolean
  fixedOperator?: { id: string; name: string } | null
  currentUploader?: string | null
  canAudit?: boolean
  mobile?: boolean
}

const SHIFT_LEADER_OPTIONS = [
  '刘向阳',
  '归国龙',
  '沈佳伟',
  '周宏凯',
  '崔路路',
  '张宏',
  '刘强',
].map((name) => ({
  label: name,
  value: name,
}))

const DEFAULT_INSPECTOR_NAME = '崔路路'

type MaterialTransferFormValues = Omit<MaterialTransferInsert, 'operator_names'>

export default function MaterialTransferForm({
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
  const [form] = Form.useForm<MaterialTransferFormValues>()
  const { data: projectNos, isLoading: isLoadingProjectNos } =
    useSalesOrdersProjectNos()

  const employeeNameMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee.name])),
    [employees],
  )

  const recipientOptions = useMemo(
    () =>
      MATERIAL_TRANSFER_RECIPIENTS.map((name) => ({
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
        product_model: initialValues.product_model || undefined,
        length_mm: initialValues.length_mm ?? undefined,
        customer_model: initialValues.customer_model || undefined,
        transfer_quantity: initialValues.transfer_quantity,
        operator_employee_ids: initialValues.operator_employee_ids,
        target_workshop: initialValues.target_workshop,
        recipient_name: initialValues.recipient_name,
        shift_leader_name: initialValues.shift_leader_name || undefined,
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
    })
  }, [currentUploader, fixedOperator?.id, form, initialValues, open])

  function handleProjectChange(projectNo: string) {
    const selectedProject = projectInfoMap.get(projectNo)

    form.setFieldsValue({
      product_model: selectedProject?.product_model || undefined,
      length_mm: selectedProject?.length_mm ?? undefined,
      customer_model: selectedProject?.customer_model || undefined,
    })
  }

  async function handleFinish(values: MaterialTransferFormValues) {
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
      customer_model: values.customer_model || null,
      transfer_quantity: values.transfer_quantity,
      operator_employee_id: operatorEmployeeIds[0],
      operator_employee_ids: operatorEmployeeIds,
      operator_names: operatorNames,
      target_workshop: values.target_workshop,
      recipient_name: values.recipient_name,
      shift_leader_name: values.shift_leader_name || null,
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
      title={initialValues ? '编辑物料转移单' : '创建物料转移单'}
      open={open}
      onCancel={onCancel}
      width={mobile ? 'calc(100vw - 24px)' : 760}
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

          <div className="grid grid-cols-3 gap-3">
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
                options={MATERIAL_TRANSFER_WORKSHOPS.map((workshop) => ({
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
            <Form.Item name="shift_leader_name" label="当班负责人">
              <AutoComplete
                allowClear
                placeholder="可选择或手动填写"
                options={SHIFT_LEADER_OPTIONS}
                filterOption
                getPopupContainer={getPopupContainer}
              />
            </Form.Item>

            <Form.Item name="inspector_name" label="检验人">
              <Input placeholder="默认崔路路，可修改" />
            </Form.Item>
          </div>

          {mobile ? null : (
            <Form.Item name="uploaded_by_name" label="数据上传">
              <Input disabled placeholder="自动记录当前登录用户" />
            </Form.Item>
          )}

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="可填写转移说明" />
          </Form.Item>

          {canAudit ? (
            <Form.Item
              name="is_audited"
              label="审核状态"
              valuePropName="checked"
            >
              <Switch
                checkedChildren={MATERIAL_TRANSFER_AUDIT_OPTIONS[1].label}
                unCheckedChildren={MATERIAL_TRANSFER_AUDIT_OPTIONS[0].label}
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
