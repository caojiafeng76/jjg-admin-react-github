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
  PRECISION_CUTTING_TRANSFER_AUDIT_OPTIONS,
  PRECISION_CUTTING_TRANSFER_OPERATORS,
  PRECISION_CUTTING_TRANSFER_RECIPIENTS,
  PRECISION_CUTTING_TRANSFER_WORKSHOPS,
  type PrecisionCuttingTransferInsert,
  type PrecisionCuttingTransferUpdate,
  type PrecisionCuttingTransferRow,
} from '@/services/apiPrecisionCuttingTransfers'
import { useSalesOrdersProjectNos } from '@/features/production-order/useProcessStandards'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (
    values: PrecisionCuttingTransferInsert | PrecisionCuttingTransferUpdate,
  ) => Promise<void> | void
  initialValues?: PrecisionCuttingTransferRow | null
  loading?: boolean
  currentUploader?: string | null
  canAudit?: boolean
  mobile?: boolean
}

type PrecisionCuttingTransferFormValues = PrecisionCuttingTransferInsert

export default function MaterialTransferForm({
  open,
  onCancel,
  onSubmit,
  initialValues,
  loading = false,
  currentUploader = null,
  canAudit = true,
  mobile = false,
}: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<PrecisionCuttingTransferFormValues>()
  const { data: projectNos, isLoading: isLoadingProjectNos } =
    useSalesOrdersProjectNos()

  const recipientOptions = useMemo(
    () =>
      PRECISION_CUTTING_TRANSFER_RECIPIENTS.map((name) => ({
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
        raw_material_defect_count: initialValues.raw_material_defect_count,
        processing_defect_count: initialValues.processing_defect_count,
        outsource_defect_quantity: initialValues.outsource_defect_quantity,
        defect_reason: initialValues.defect_reason || undefined,
        outsource_defect_reason:
          initialValues.outsource_defect_reason || undefined,
        outsource_unit: initialValues.outsource_unit || undefined,
        long_material_length_mm:
          initialValues.long_material_length_mm ?? undefined,
        long_material_quantity: initialValues.long_material_quantity,
        transfer_quantity: initialValues.transfer_quantity,
        operator_names: initialValues.operator_names,
        target_workshop: initialValues.target_workshop,
        recipient_name: initialValues.recipient_name,
        responsible_process: initialValues.responsible_process || undefined,
        process_owner: initialValues.process_owner || undefined,
        inspector_name: initialValues.inspector_name || undefined,
        uploaded_by_name: initialValues.uploaded_by_name || undefined,
        remark: initialValues.remark || undefined,
        is_audited: initialValues.is_audited,
      })
      return
    }

    form.resetFields()
    form.setFieldsValue({
      operator_names: undefined,
      raw_material_defect_count: 0,
      processing_defect_count: 0,
      outsource_defect_quantity: 0,
      uploaded_by_name: currentUploader || undefined,
      is_audited: false,
    })
  }, [currentUploader, form, initialValues, open])

  function handleProjectChange(projectNo: string) {
    const selectedProject = projectInfoMap.get(projectNo)

    form.setFieldsValue({
      customer: selectedProject?.customer || undefined,
      product_model: selectedProject?.product_model || undefined,
      length_mm: selectedProject?.length_mm ?? undefined,
      customer_model: selectedProject?.customer_model || undefined,
    })
  }

  async function handleFinish(values: PrecisionCuttingTransferFormValues) {
    if (!values.project_no?.trim()) {
      message.warning('请选择项目号')
      return
    }

    const operatorNames = values.operator_names || []

    if (operatorNames.length === 0) {
      message.warning('请选择至少一名操作人')
      return
    }

    await onSubmit({
      project_no: values.project_no,
      product_model: values.product_model || null,
      length_mm: values.length_mm ?? null,
      customer: values.customer || null,
      customer_model: values.customer_model || null,
      raw_material_defect_count: values.raw_material_defect_count,
      processing_defect_count: values.processing_defect_count,
      outsource_defect_quantity: values.outsource_defect_quantity ?? 0,
      defect_reason: values.defect_reason || null,
      outsource_defect_reason: values.outsource_defect_reason || null,
      outsource_unit: values.outsource_unit || null,
      long_material_length_mm: values.long_material_length_mm,
      long_material_quantity: values.long_material_quantity,
      transfer_quantity: values.transfer_quantity,
      operator_names: operatorNames,
      target_workshop: values.target_workshop,
      recipient_name: values.recipient_name,
      responsible_process: values.responsible_process || null,
      process_owner: values.process_owner || null,
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
      title={initialValues ? '编辑精切转移单' : '创建精切转移单'}
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
              initialValue={0}
              rules={[{ required: true, message: '请输入原料不良数' }]}
            >
              <InputNumber min={0} precision={0} className="w-full" />
            </Form.Item>

            <Form.Item
              name="processing_defect_count"
              label="加工不良数"
              initialValue={0}
              rules={[{ required: true, message: '请输入加工不良数' }]}
            >
              <InputNumber min={0} precision={0} className="w-full" />
            </Form.Item>

            <Form.Item
              name="outsource_defect_quantity"
              label="外协不良数"
              initialValue={0}
            >
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item name="defect_reason" label="不良原因">
              <Input.TextArea rows={2} placeholder="由用户填写不良原因" />
            </Form.Item>

            <Form.Item name="outsource_defect_reason" label="外协不良原因">
              <Input.TextArea rows={2} placeholder="可填写外协不良原因" />
            </Form.Item>

            <Form.Item name="outsource_unit" label="外协单位">
              <Input placeholder="请输入外协单位" />
            </Form.Item>

            <Form.Item name="responsible_process" label="责任工序">
              <Input placeholder="请输入责任工序" />
            </Form.Item>

            <Form.Item name="process_owner" label="工序负责人">
              <Input placeholder="请输入工序负责人" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              name="operator_names"
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
                options={PRECISION_CUTTING_TRANSFER_OPERATORS.map((name) => ({
                  label: name,
                  value: name,
                }))}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              name="target_workshop"
              label="接收车间"
              rules={[{ required: true, message: '请选择接收车间' }]}
            >
              <Select
                placeholder="请选择接收车间"
                getPopupContainer={getPopupContainer}
                options={PRECISION_CUTTING_TRANSFER_WORKSHOPS.map(
                  (workshop) => ({
                    label: workshop,
                    value: workshop,
                  }),
                )}
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

          <div className="grid grid-cols-1 gap-3">
            <Form.Item name="inspector_name" label="检验人">
              <Input placeholder="可选填写" />
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
                checkedChildren={
                  PRECISION_CUTTING_TRANSFER_AUDIT_OPTIONS[1].label
                }
                unCheckedChildren={
                  PRECISION_CUTTING_TRANSFER_AUDIT_OPTIONS[0].label
                }
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
