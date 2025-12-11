import {
  Form,
  FormInstance,
  type FormListFieldData,
  DatePicker,
  Select,
  InputNumber,
  Input,
  Button,
  Space,
  Card,
  Divider,
} from 'antd'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon, XCircleIcon } from '@heroicons/react/16/solid'
import type { ProductionSheetRecord } from '@/services/apiProductionSheets'
import type { DefectReasonItem } from '@/services/apiProductionRecords'
import { getWorkshopOrders } from '@/services/apiWorkshopOrders'
import { getWorkshopProcesses } from '@/services/apiWorkshopProcesses'
import { getWorkshopDefectReasons } from '@/services/apiWorkshopDefectReasons'
import { getEmployees } from '@/services/apiEmployees'

const { useWatch } = Form

// 产量单表单值类型
export interface ProductionSheetFormValues {
  production_date: dayjs.Dayjs | string
  operator_ids: string[]
  working_hours?: number | null
  remark?: string | null
  records: Array<{
    order_id: string
    process_id: string
    qualified_quantity: number
    defective_quantity: number
    defect_reasons: DefectReasonItem[]
    remark?: string | null
  }>
}

// 单个产量记录项组件
interface ProductionRecordItemProps {
  name: number
  restField: Partial<FormListFieldData>
  form: FormInstance<ProductionSheetFormValues>
  isCreating: boolean
  orderOptions: Array<{
    value: string
    label: string
    project_no: string
    product_model: string
    customer_model: string
  }>
  processOptions: Array<{ value: string; label: string }>
  defectReasonOptions: Array<{ value: string; label: string }>
  onRemove: () => void
}

function ProductionRecordItem({
  name,
  restField,
  form,
  isCreating,
  orderOptions,
  processOptions,
  defectReasonOptions,
  onRemove,
}: ProductionRecordItemProps) {
  // 在组件内部使用 useWatch
  const recordDefectReasons = useWatch(
    ['records', name, 'defect_reasons'],
    form,
  )
  const totalDefectiveQuantity = recordDefectReasons
    ? recordDefectReasons.reduce(
        (sum: number, item: DefectReasonItem) => sum + (item?.quantity || 0),
        0,
      )
    : 0

  return (
    <Card
      title={`记录 ${name + 1}`}
      extra={
        <Button
          type="text"
          danger
          icon={<XCircleIcon className="size-4" />}
          onClick={onRemove}
          disabled={isCreating}
        >
          删除
        </Button>
      }
      className="mb-4"
    >
      <Form.Item
        {...restField}
        name={[name, 'order_id']}
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
        {...restField}
        name={[name, 'process_id']}
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
        {...restField}
        name={[name, 'qualified_quantity']}
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

      <Form.Item label="不良总数">
        <InputNumber
          value={totalDefectiveQuantity}
          disabled
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item label="不良原因" required>
        <Form.List name={[name, 'defect_reasons']}>
          {(defectFields, { add: addDefect, remove: removeDefect }) => (
            <>
              {defectFields.map(
                ({ key: defectKey, name: defectName, ...defectRestField }) => (
                  <Space
                    key={defectKey}
                    style={{ display: 'flex', marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...defectRestField}
                      name={[defectName, 'defect_reason_id']}
                      rules={[{ required: true, message: '请选择不良原因' }]}
                    >
                      <Select
                        placeholder="选择不良原因"
                        disabled={isCreating}
                        showSearch
                        filterOption={(input, option) =>
                          (option?.label ?? '')
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        style={{ width: 200 }}
                        options={defectReasonOptions}
                      />
                    </Form.Item>
                    <Form.Item
                      {...defectRestField}
                      name={[defectName, 'quantity']}
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
                      onClick={() => removeDefect(defectName)}
                      className="size-4 cursor-pointer text-red-500 hover:text-red-600"
                      style={{
                        pointerEvents: isCreating ? 'none' : 'auto',
                        opacity: isCreating ? 0.5 : 1,
                      }}
                    />
                  </Space>
                ),
              )}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => addDefect()}
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

      <Form.Item {...restField} name={[name, 'remark']} label="备注">
        <Input.TextArea
          rows={2}
          placeholder="请输入备注（可选）"
          disabled={isCreating}
        />
      </Form.Item>
    </Card>
  )
}

interface Props {
  onFinish: (values: {
    production_date: string
    operator_ids: string[]
    working_hours?: number | null
    remark?: string | null
    records: ProductionSheetRecord[]
  }) => void
  setFormRef: (form: FormInstance<ProductionSheetFormValues>) => void
  isCreating: boolean
  initialValues?: {
    production_date: string
    operator_ids?: string[]
    working_hours?: number | null
    remark?: string | null
    records?: ProductionSheetRecord[]
  }
}

export default function ProductionSheetForm({
  onFinish,
  setFormRef,
  isCreating,
  initialValues,
}: Props) {
  const [form] = Form.useForm<ProductionSheetFormValues>()

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
      form.setFieldsValue({
        production_date: initialValues.production_date
          ? dayjs(initialValues.production_date)
          : dayjs().subtract(1, 'day'),
        operator_ids: initialValues.operator_ids || [],
        working_hours: initialValues.working_hours || undefined,
        remark: initialValues.remark || undefined,
        records: initialValues.records || [],
      })
    } else {
      form.setFieldsValue({
        production_date: dayjs().subtract(1, 'day'),
        operator_ids: [],
        working_hours: undefined,
        remark: undefined,
        records: [],
      })
    }
  }, [form, initialValues])

  const handleFinish = (values: ProductionSheetFormValues) => {
    // 验证至少有一条记录
    if (!values.records || values.records.length === 0) {
      // 手动设置错误信息
      form.setFields([
        {
          name: ['records'],
          errors: ['至少需要添加一条产量记录'],
        },
      ])
      // 滚动到错误位置
      setTimeout(() => {
        const errorElement = document.querySelector('.ant-form-item-has-error')
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
      return
    }

    const formattedRecords: ProductionSheetRecord[] = values.records.map(
      (record) => {
        const totalDefectiveQuantity = record.defect_reasons
          ? record.defect_reasons.reduce(
              (sum: number, item: DefectReasonItem) =>
                sum + (item.quantity || 0),
              0,
            )
          : 0

        return {
          ...record,
          production_date: dayjs(values.production_date).format('YYYY-MM-DD'),
          operator_ids: values.operator_ids, // 使用产量单的操作者
          defective_quantity: totalDefectiveQuantity,
          defect_reasons: record.defect_reasons || [],
        }
      },
    )

    onFinish({
      production_date: dayjs(values.production_date).format('YYYY-MM-DD'),
      operator_ids: values.operator_ids,
      working_hours: values.working_hours || null,
      remark: values.remark || null,
      records: formattedRecords,
    })
  }

  // 订单选项
  const orderOptions =
    ordersData?.items
      .filter((order) => order.id)
      .map((order) => {
        const lengthText = order.length_mm ? `-${order.length_mm}mm` : ''
        const productModelWithLength = `${order.product_model || ''}${lengthText}`
        return {
          value: order.id!,
          label:
            `${order.project_no || ''} - ${productModelWithLength} - ${order.customer_model || ''}`.trim(),
          project_no: order.project_no || '',
          product_model: order.product_model || '',
          customer_model: order.customer_model || '',
        }
      }) || []

  // 工序选项
  const processOptions =
    processesData?.items
      .filter((process) => process.id)
      .map((process) => ({
        value: process.id!,
        label: process.process_name,
      })) || []

  // 不良原因选项
  const defectReasonOptions =
    defectReasonsData?.items
      .filter((reason) => reason.id)
      .map((reason) => ({
        value: reason.id!,
        label: reason.defect_reason,
      })) || []

  // 员工选项
  const employeeOptions =
    employeesData?.items
      .filter((employee) => employee.id)
      .map((employee) => ({
        value: employee.id!,
        label: employee.name,
      })) || []

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={isCreating}
    >
      <Form.Item
        name="production_date"
        label="产量日期"
        rules={[{ required: true, message: '请选择日期' }]}
        initialValue={dayjs().subtract(1, 'day')}
      >
        <DatePicker
          style={{ width: '100%' }}
          format="YYYY-MM-DD"
          disabled={isCreating}
          allowClear={false}
        />
      </Form.Item>

      <Form.Item
        name="operator_ids"
        label="操作者"
        rules={[{ type: 'array', min: 1, message: '请至少选择一个操作者' }]}
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

      <Form.Item name="working_hours" label="工时（H）">
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={0.1}
          precision={1}
          placeholder="请输入工时，例如：11.5"
          disabled={isCreating}
        />
      </Form.Item>

      <Divider>产量记录</Divider>

      <Form.List
        name="records"
        rules={[
          {
            validator: async (_, records) => {
              if (!records || records.length === 0) {
                return Promise.reject(new Error('至少需要添加一条产量记录'))
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <ProductionRecordItem
                key={key}
                name={name}
                restField={restField}
                form={form}
                isCreating={isCreating}
                orderOptions={orderOptions}
                processOptions={processOptions}
                defectReasonOptions={defectReasonOptions}
                onRemove={() => remove(name)}
              />
            ))}

            <Form.Item>
              <Button
                type="dashed"
                onClick={() =>
                  add({
                    order_id: undefined,
                    process_id: undefined,
                    qualified_quantity: 0,
                    defective_quantity: 0,
                    defect_reasons: [],
                    remark: undefined,
                  })
                }
                block
                icon={<PlusIcon className="size-4" />}
                disabled={isCreating}
              >
                添加产量记录
              </Button>
              {errors && errors.length > 0 && (
                <div className="mt-2 text-sm text-red-500">{errors[0]}</div>
              )}
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item name="remark" label="产量单备注">
        <Input.TextArea
          rows={3}
          placeholder="请输入产量单备注（可选）"
          disabled={isCreating}
        />
      </Form.Item>
    </Form>
  )
}
