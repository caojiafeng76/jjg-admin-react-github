import { useEffect, useMemo } from 'react'
import { Modal, Form, InputNumber, Select, Input } from 'antd'

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
}

export default function ProductionOrderItemForm({
  open,
  onCancel,
  onSubmit,
  initialValues,
  orderId,
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

  const { data: operations, isLoading: loadingOperations } =
    useOperationsByModel(productModel || undefined)

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues)
    } else {
      form.resetFields()
      form.setFieldsValue({
        order_id: orderId,
        qualified_quantity: 0,
        defect_reason_1: '加工',
        defect_quantity_1: 0,
        defect_reason_2: '原料',
        defect_quantity_2: 0,
        bonus_seconds: 0,
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
    if (selectedOperation && operations) {
      const operationData = operations.find(
        (op) => op.operation === selectedOperation,
      )
      if (operationData) {
        form.setFieldsValue({
          standard_seconds: operationData.standard_seconds,
        })
      }
    }
  }, [selectedOperation, operations, form])

  const handleFinish = (values: Partial<ProductionOrderItem>) => {
    onSubmit({
      ...values,
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

  const handleOperationChange = () => {
    form.setFieldsValue({
      standard_seconds: undefined,
    })
  }

  return (
    <Modal
      title={initialValues ? '编辑工序明细' : '添加工序明细'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={700}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          order_id: orderId,
          qualified_quantity: 0,
          defect_reason_1: '加工',
          defect_quantity_1: 0,
          defect_reason_2: '原料',
          defect_quantity_2: 0,
          bonus_seconds: 0,
        }}
      >
        <Form.Item name="order_id" hidden>
          <Input />
        </Form.Item>

        <Form.Item
          name="project_no"
          label="项目号"
          rules={[{ required: true, message: '请选择项目号' }]}
        >
          <Select
            showSearch
            placeholder="请选择项目号"
            loading={loadingProjectNos}
            onChange={handleProjectNoChange}
            options={projectNoOptions}
            filterOption={filterProjectNoOption}
            optionRender={renderProjectNoOption}
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
            placeholder="请选择工序"
            loading={loadingOperations}
            onChange={handleOperationChange}
            options={operations?.map((item) => ({
              label: item.operation,
              value: item.operation,
            }))}
            style={{ width: '100%' }}
            disabled={!productModel}
          />
        </Form.Item>

        <Form.Item
          name="standard_seconds"
          label="标准工时(秒)"
          rules={[{ required: true, message: '请输入标准工时' }]}
        >
          <InputNumber
            min={0}
            step={1}
            style={{ width: '100%' }}
            placeholder="请输入标准工时(秒)"
          />
        </Form.Item>

        <Form.Item
          name="qualified_quantity"
          label="合格数量"
          rules={[{ required: true, message: '请输入合格数量' }]}
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

        <Form.Item name="bonus_seconds" label="加分项(秒)" initialValue={0}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
