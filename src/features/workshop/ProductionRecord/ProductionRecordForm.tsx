import { Form, FormInstance, DatePicker, Select, InputNumber, Input, Button, Space } from 'antd'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon, XCircleIcon } from '@heroicons/react/16/solid'
import type { ProductionRecord, DefectReasonItem } from '@/services/apiProductionRecords'
import { getWorkshopOrders } from '@/services/apiWorkshopOrders'
import { getWorkshopProcesses } from '@/services/apiWorkshopProcesses'
import { getWorkshopDefectReasons } from '@/services/apiWorkshopDefectReasons'
import { getEmployees } from '@/services/apiEmployees'

const { useWatch } = Form

// 表单类型，允许 production_date 为 Dayjs 类型
type ProductionRecordFormValues = Omit<ProductionRecord, 'production_date'> & {
  production_date: dayjs.Dayjs | string
}

interface Props {
  onFinish: (values: ProductionRecord) => void
  setFormRef: (form: FormInstance<ProductionRecordFormValues>) => void
  isCreating: boolean
  isEdit: boolean
  initialValues?: ProductionRecord
}

export default function ProductionRecordForm({
  onFinish,
  setFormRef,
  isCreating,
  initialValues,
}: Props) {
  const [form] = Form.useForm<ProductionRecordFormValues>()

  // 获取订单列表
  const { data: ordersData } = useQuery({
    queryKey: ['workshop-orders', 1, 1000],
    queryFn: () => getWorkshopOrders({ page: 1, pageSize: 1000 }),
  })

  // 获取工序列表
  const { data: processesData } = useQuery({
    queryKey: ['workshop-processes', 1, 1000],
    queryFn: () => getWorkshopProcesses({ page: 1, pageSize: 1000 }),
  })

  // 获取不良原因列表
  const { data: defectReasonsData } = useQuery({
    queryKey: ['workshop-defect-reasons', 1, 1000],
    queryFn: () => getWorkshopDefectReasons({ page: 1, pageSize: 1000 }),
  })

  // 获取员工列表
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 1, 1000],
    queryFn: () => getEmployees({ page: 1, pageSize: 1000 }),
  })

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      // 转换日期格式
      const values = {
        ...initialValues,
        production_date: initialValues.production_date
          ? dayjs(initialValues.production_date)
          : dayjs(),
        defect_reasons: initialValues.defect_reasons || [],
      }
      form.setFieldsValue(values)
    } else {
      // 设置默认值
      form.setFieldsValue({
        production_date: dayjs(),
        qualified_quantity: 0,
        defective_quantity: 0,
        defect_reasons: [],
        operator_ids: [],
      })
    }
  }, [form, initialValues])

  const handleFinish = (values: any) => {
    // 计算不良总数
    const totalDefectiveQuantity = values.defect_reasons
      ? values.defect_reasons.reduce((sum: number, item: DefectReasonItem) => sum + (item.quantity || 0), 0)
      : 0

    const formattedValues: ProductionRecord = {
      ...values,
      production_date: values.production_date
        ? dayjs(values.production_date).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
      defective_quantity: totalDefectiveQuantity,
      defect_reasons: values.defect_reasons || [],
    }
    onFinish(formattedValues)
  }

  // 订单选项 - 保存更多信息以便搜索
  const orderOptions =
    ordersData?.items.map((order) => ({
      value: order.id,
      label: `${order.project_no || ''} - ${order.product_model || ''} - ${order.customer_model || ''}`.trim(),
      // 保存原始数据用于搜索
      project_no: order.project_no || '',
      product_model: order.product_model || '',
      customer_model: order.customer_model || '',
    })) || []

  // 工序选项
  const processOptions =
    processesData?.items.map((process) => ({
      value: process.id,
      label: process.process_name,
    })) || []

  // 不良原因选项
  const defectReasonOptions =
    defectReasonsData?.items.map((reason) => ({
      value: reason.id,
      label: reason.defect_reason,
    })) || []

  // 员工选项
  const employeeOptions =
    employeesData?.items.map((employee) => ({
      value: employee.id,
      label: employee.name,
    })) || []

  // 监听不良原因变化，计算总数
  const defectReasons = useWatch('defect_reasons', form)
  const totalDefectiveQuantity = defectReasons
    ? defectReasons.reduce((sum: number, item: DefectReasonItem) => sum + (item?.quantity || 0), 0)
    : 0

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={isCreating}
    >
      <Form.Item
        name="production_date"
        label="日期"
        rules={[{ required: true, message: '请选择日期' }]}
        initialValue={dayjs()}
      >
        <DatePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          disabled={isCreating}
          allowClear={false}
        />
      </Form.Item>

      <Form.Item
        name="order_id"
        label="订单详情"
        rules={[{ required: true, message: '请选择订单' }]}
      >
        <Select
          placeholder="请选择订单（可根据项目号、产品型号、客户型号搜索）"
          disabled={isCreating}
          showSearch
          filterOption={(input, option) => {
            const searchText = input.toLowerCase()
            const label = (option?.label ?? '').toLowerCase()
            const projectNo = (option?.project_no ?? '').toLowerCase()
            const productModel = (option?.product_model ?? '').toLowerCase()
            const customerModel = (option?.customer_model ?? '').toLowerCase()
            
            // 支持搜索项目号、产品型号、客户型号或完整标签
            return (
              label.includes(searchText) ||
              projectNo.includes(searchText) ||
              productModel.includes(searchText) ||
              customerModel.includes(searchText)
            )
          }}
          options={orderOptions}
        />
      </Form.Item>

      <Form.Item
        name="process_id"
        label="工序"
        rules={[{ required: true, message: '请选择工序' }]}
      >
        <Select
          placeholder="请选择工序"
          disabled={isCreating}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={processOptions}
        />
      </Form.Item>

      <Form.Item
        name="qualified_quantity"
        label="合格数量"
        rules={[
          { required: true, message: '请输入合格数量' },
          { type: 'number', min: 0, message: '合格数量不能小于0' },
        ]}
        initialValue={0}
      >
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          placeholder="请输入合格数量"
          disabled={isCreating}
        />
      </Form.Item>

      <Form.Item
        label="不良总数"
      >
        <InputNumber
          value={totalDefectiveQuantity}
          disabled
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        label="不良原因"
        required
      >
        <Form.List name="defect_reasons">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'defect_reason_id']}
                    rules={[{ required: true, message: '请选择不良原因' }]}
                  >
                    <Select
                      placeholder="选择不良原因"
                      disabled={isCreating}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      style={{ width: 200 }}
                      options={defectReasonOptions}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    rules={[
                      { required: true, message: '请输入数量' },
                      { type: 'number', min: 1, message: '数量必须大于0' },
                    ]}
                  >
                    <InputNumber
                      placeholder="数量"
                      min={1}
                      disabled={isCreating}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                  <XCircleIcon
                    onClick={() => remove(name)}
                    className="size-4 cursor-pointer text-red-500 hover:text-red-600"
                    style={{ pointerEvents: isCreating ? 'none' : 'auto', opacity: isCreating ? 0.5 : 1 }}
                  />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusIcon className="size-4" />}
                  disabled={isCreating}
                >
                  添加不良原因
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item
        name="operator_ids"
        label="操作者"
        rules={[
          { type: 'array', min: 1, message: '请至少选择一个操作者' },
        ]}
      >
        <Select
          mode="multiple"
          placeholder="请选择操作者（可多选）"
          disabled={isCreating}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={employeeOptions}
        />
      </Form.Item>

      <Form.Item
        name="remark"
        label="备注"
      >
        <Input.TextArea
          rows={3}
          placeholder="请输入备注（可选）"
          disabled={isCreating}
        />
      </Form.Item>
    </Form>
  )
}

