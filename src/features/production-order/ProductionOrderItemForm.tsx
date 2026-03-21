import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  App,
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
  AutoComplete,
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
import { ensureStandardTimeExists } from '@/services/apiStandardTimes'

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
  const { message } = App.useApp()
  const queryClient = useQueryClient()
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
    const operationExists = operations?.some(
      (item) => item.operation === operation,
    )

    if (operation && !operationExists && productModel) {
      try {
        const created = await ensureStandardTimeExists({
          operation,
          model: productModel,
          standard_seconds: 0,
        })

        if (created) {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['standard-times'] }),
            queryClient.invalidateQueries({ queryKey: ['process-standards'] }),
          ])
          message.success('未匹配工序已加入标准工时，默认标准工时为 0')
        }
      } catch (error) {
        message.error(
          error instanceof Error
            ? error.message
            : '补建标准工时失败，请稍后重试',
        )
        return
      }
    }

    onSubmit({
      ...values,
      operation,
      standard_seconds: Number(values.standard_seconds ?? 0),
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

        {compact ? (
          <div className="mb-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            手机端建议先选择项目号，再补充工序、数量和不良数，便于自动带出型号与标准工时。
          </div>
        ) : null}

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
          rules={[
            { required: true, message: '请输入工序' },
            {
              validator: async (_, value) => {
                if (typeof value === 'string' && value.trim()) {
                  return
                }

                throw new Error('请输入工序')
              },
            },
          ]}
        >
          <AutoComplete
            placeholder="请选择或输入工序"
            onChange={handleOperationChange}
            options={operationOptions}
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
