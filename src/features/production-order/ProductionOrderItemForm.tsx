import { useEffect, useMemo } from 'react'
import {
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
} from 'antd'

import type { ProductionOrderItem } from '@/services/apiProductionOrderItems'
import {
  buildProjectNoSelectOptions,
  filterProjectNoOption,
  renderProjectNoOption,
} from './projectNoSelect'
import {
  useSalesOrdersProjectNos,
  useOperationsByModel,
} from './useProcessStandards'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (values: Partial<ProductionOrderItem>) => void
  initialValues?: ProductionOrderItem
  orderId: string
  compact?: boolean
}

export default function ProductionOrderItemForm({
  open,
  onCancel,
  onSubmit,
  initialValues,
  orderId,
  compact = false,
}: Props) {
  const [form] = Form.useForm()
  const { data: projectNos, isLoading: loadingProjectNos } =
    useSalesOrdersProjectNos()

  const selectedProjectNo = Form.useWatch('project_no', form)
  const selectedOperation = Form.useWatch('operation', form)

  const projectNoData = useMemo(
    () => projectNos?.find((item) => item.project_no === selectedProjectNo),
    [projectNos, selectedProjectNo],
  )
  const projectNoOptions = useMemo(
    () => buildProjectNoSelectOptions(projectNos),
    [projectNos],
  )
  const productModel = projectNoData?.product_model || ''

  const { data: operations } = useOperationsByModel(productModel || undefined)

  const operationOptions = useMemo(
    () =>
      operations?.map((item) => ({
        label: item.operation,
        value: item.operation,
      })) || [],
    [operations],
  )

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    } else {
      form.resetFields()
      form.setFieldsValue({
        order_id: orderId,
        data_category: 'A',
        incoming_qualified_quantity: 0,
        qualified_quantity: 0,
        defect_reason_1: '加工',
        defect_quantity_1: 0,
        defect_reason_2: '原料',
        defect_quantity_2: 0,
      })
    }
  }, [initialValues, orderId, form, open])

  useEffect(() => {
    if (projectNoData) {
      form.setFieldsValue({
        product_model: projectNoData.product_model,
        length_mm: projectNoData.length_mm,
        customer_model: projectNoData.customer_model,
      })
    }
  }, [projectNoData, form])

  useEffect(() => {
    const normalizedOperation =
      typeof selectedOperation === 'string' ? selectedOperation.trim() : ''

    if (!normalizedOperation) {
      return
    }

    const operationData = operations?.find(
      (op) => op.operation === normalizedOperation,
    )
    const currentStandardSeconds = form.getFieldValue('standard_seconds')

    if (operationData) {
      if (currentStandardSeconds !== operationData.standard_seconds) {
        form.setFieldsValue({
          standard_seconds: operationData.standard_seconds,
        })
      }
      return
    }

    if (
      currentStandardSeconds === undefined ||
      currentStandardSeconds === null ||
      currentStandardSeconds === ''
    ) {
      form.setFieldsValue({ standard_seconds: 0 })
    }
  }, [selectedOperation, operations, form])

  const handleFinish = async (values: Partial<ProductionOrderItem>) => {
    const operation = values.operation?.trim()

    onSubmit({
      ...values,
      data_category:
        values.data_category || initialValues?.data_category || 'A',
      operation,
      incoming_qualified_quantity: Number(
        values.incoming_qualified_quantity ?? 0,
      ),
      standard_seconds: Number(
        values.standard_seconds ?? form.getFieldValue('standard_seconds') ?? 0,
      ),
      order_id: orderId,
    } as Partial<ProductionOrderItem>)
    form.resetFields()
  }

  const handleProjectNoChange = () => {
    form.setFieldsValue({
      operation: undefined,
      standard_seconds: undefined,
    })
  }

  const handleOperationChange = (value: string) => {
    const normalizedOperation = value.trim()
    const operationData = operations?.find(
      (item) => item.operation === normalizedOperation,
    )

    form.setFieldsValue({
      operation: value,
      standard_seconds: operationData?.standard_seconds ?? 0,
    })
  }

  const getPopupContainer = (triggerNode: HTMLElement) =>
    triggerNode.parentElement || document.body

  return (
    <Modal
      title={initialValues ? '编辑工序明细' : '添加工序明细'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={compact ? 'calc(100vw - 20px)' : 700}
      style={compact ? { top: 12, maxWidth: 560 } : undefined}
      destroyOnClose
    >
      <div
        className={
          compact
            ? 'max-h-[calc(100vh-240px)] overflow-y-auto overscroll-contain pr-1'
            : undefined
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            order_id: orderId,
            data_category: 'A',
            incoming_qualified_quantity: 0,
            qualified_quantity: 0,
            defect_reason_1: '加工',
            defect_quantity_1: 0,
            defect_reason_2: '原料',
            defect_quantity_2: 0,
          }}
        >
          <Form.Item name="order_id" hidden>
            <Input />
          </Form.Item>

          {compact ? (
            <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              手机端建议先选择项目号，再补充工序、数量和不良数，便于自动带出型号与标准工时。
            </div>
          ) : null}

          {compact ? null : (
            <Form.Item
              name="data_category"
              label="数据类别"
              rules={[{ required: true, message: '请选择数据类别' }]}
            >
              <Select
                options={[
                  { label: 'A', value: 'A' },
                  { label: 'B', value: 'B' },
                ]}
              />
            </Form.Item>
          )}

          <Form.Item
            name="project_no"
            label="项目号"
            rules={[{ required: true, message: '请选择项目号' }]}
          >
            <Select
              showSearch
              placeholder="请选择项目号"
              loading={loadingProjectNos}
              getPopupContainer={getPopupContainer}
              onChange={handleProjectNoChange}
              options={projectNoOptions}
              filterOption={filterProjectNoOption}
              optionRender={renderProjectNoOption}
              listHeight={320}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="product_model" label="型号">
            <Input disabled />
          </Form.Item>

          <Form.Item name="length_mm" label="长度(mm)">
            <Input disabled />
          </Form.Item>

          <Form.Item name="customer_model" label="客户型号">
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="operation"
            label="工序"
            rules={[{ required: true, message: '请选择工序' }]}
          >
            <Select
              showSearch
              placeholder="请选择工序"
              onChange={handleOperationChange}
              options={operationOptions}
              getPopupContainer={getPopupContainer}
              filterOption={(input, option) => {
                if (!option) return false
                return (
                  option.value
                    ?.toString()
                    .toLowerCase()
                    .includes(input.toLowerCase()) ?? false
                )
              }}
              style={{ width: '100%' }}
              disabled={!productModel}
            />
          </Form.Item>

          {!compact ? (
            <Form.Item
              name="standard_seconds"
              label="标准工时(秒)"
              rules={[{ required: true, message: '请输入标准工时' }]}
            >
              <InputNumber
                min={0}
                step={1}
                style={{ width: '100%' }}
                placeholder="根据工序自动带出"
                disabled
              />
            </Form.Item>
          ) : null}

          <Form.Item
            name="incoming_qualified_quantity"
            label="来料接收数"
            dependencies={[
              'qualified_quantity',
              'defect_quantity_1',
              'defect_quantity_2',
            ]}
            rules={[
              { required: true, message: '请输入来料接收数' },
              ({ getFieldValue }) => ({
                validator: async (_, value) => {
                  const incomingQualifiedQuantity = Number(value || 0)
                  const qualifiedQuantity = Number(
                    getFieldValue('qualified_quantity') || 0,
                  )
                  const defectQuantity1 = Number(
                    getFieldValue('defect_quantity_1') || 0,
                  )
                  const defectQuantity2 = Number(
                    getFieldValue('defect_quantity_2') || 0,
                  )
                  const minimumQuantity =
                    qualifiedQuantity + defectQuantity1 + defectQuantity2

                  if (incomingQualifiedQuantity < minimumQuantity) {
                    throw new Error('来料接收数不能小于成品合格数与不良数之和')
                  }
                },
              }),
            ]}
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="qualified_quantity"
            label="成品合格数"
            rules={[{ required: true, message: '请输入成品合格数' }]}
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="defect_quantity_1"
            label="加工不良数量"
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="defect_quantity_2"
            label="原料不良数量"
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
