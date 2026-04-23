import { useEffect } from 'react'
import {
  Button,
  DatePicker,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Radio,
  Table,
} from 'antd'
import { PlusCircleIcon, XMarkIcon } from '@heroicons/react/16/solid'
import dayjs from 'dayjs'

import type {
  VillaLiftOrder,
  VillaLiftOrderFormValues,
} from '@/services/apiVillaLiftOrders'

interface Props {
  onFinish: (values: VillaLiftOrderFormValues) => void
  setFormRef: (form: FormInstance<VillaLiftOrderFormValues>) => void
  isSubmitting: boolean
  initialValues?: VillaLiftOrder | null
  /** 仅编辑主订单（不含明细），用于订单编辑弹窗 */
  orderOnly?: boolean
  /** 仅编辑明细（不含主订单字段），用于明细编辑弹窗 */
  itemsOnly?: boolean
}

const DEFAULT_ORDER_VALUES: VillaLiftOrderFormValues = {
  schedule_date: null,
  delivery_date: null,
  customer: '',
  project_name: '',
  product_name: '',
  color: '',
  quantity: 0,
  remarks: '',
  status: 'open',
  items: [],
}

export default function VillaLiftOrderForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
  orderOnly = false,
  itemsOnly = false,
}: Props) {
  const [form] = Form.useForm<VillaLiftOrderFormValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        schedule_date: initialValues.schedule_date
          ? dayjs(initialValues.schedule_date)
          : null,
        delivery_date: initialValues.delivery_date
          ? dayjs(initialValues.delivery_date)
          : null,
        customer: initialValues.customer,
        project_name: initialValues.project_name,
        product_name: initialValues.product_name,
        color: initialValues.color,
        quantity: initialValues.quantity,
        remarks: initialValues.remarks,
        status: initialValues.status ?? 'open',
        items: orderOnly
          ? []
          : (initialValues.items ?? []).map((item) => ({
              model: item.model,
              name: item.name,
              spec: item.spec,
              quantity: item.quantity,
              remarks: item.remarks,
            })),
      })
    } else {
      form.resetFields()
      form.setFieldsValue(DEFAULT_ORDER_VALUES)
    }
  }, [form, initialValues, orderOnly])

  function handleFinish(raw: VillaLiftOrderFormValues) {
    onFinish({
      ...raw,
      items: (raw.items ?? []).map((item) => ({
        model: item.model ?? '',
        name: item.name ?? '',
        spec: item.spec ?? '',
        quantity: Number(item.quantity ?? 0),
        remarks: item.remarks ?? '',
      })),
    })
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      disabled={isSubmitting}
    >
      {/* 主订单字段 */}
      {!itemsOnly && (
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item name="schedule_date" label="排产日期">
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="选择排产日期"
            />
          </Form.Item>
          <Form.Item name="delivery_date" label="交货日期">
            <DatePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="选择交货日期"
            />
          </Form.Item>
          <Form.Item name="customer" label="客户" rules={[{ max: 200 }]}>
            <Input placeholder="请输入客户" />
          </Form.Item>
          <Form.Item
            name="project_name"
            label="项目名称"
            rules={[{ max: 200 }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="product_name"
            label="产品名称"
            rules={[{ max: 200 }]}
          >
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item name="color" label="颜色" rules={[{ max: 100 }]}>
            <Input placeholder="请输入颜色" />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ type: 'number', min: 0 }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
          </Form.Item>
          <Form.Item name="remarks" label="备注" rules={[{ max: 500 }]}>
            <Input placeholder="备注" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Radio.Group>
              <Radio value="open">未结案</Radio>
              <Radio value="closed">已结案</Radio>
            </Radio.Group>
          </Form.Item>
        </div>
      )}

      {/* 订单明细 */}
      {!orderOnly && (
        <Form.List name="items">
          {(fields, { add, remove }) => {
            type FieldType = (typeof fields)[number]
            const columns = [
              {
                title: '型号',
                key: 'model',
                width: 120,
                render: (_: unknown, field: FieldType) => (
                  <Form.Item
                    name={[field.name, 'model']}
                    style={{ margin: 0 }}
                    rules={[{ max: 100 }]}
                  >
                    <Input placeholder="型号" size="small" />
                  </Form.Item>
                ),
              },
              {
                title: '名称',
                key: 'name',
                width: 140,
                render: (_: unknown, field: FieldType) => (
                  <Form.Item
                    name={[field.name, 'name']}
                    style={{ margin: 0 }}
                    rules={[
                      { required: true, message: '请填写名称' },
                      { max: 200 },
                    ]}
                  >
                    <Input placeholder="名称" size="small" />
                  </Form.Item>
                ),
              },
              {
                title: '规格',
                key: 'spec',
                width: 160,
                render: (_: unknown, field: FieldType) => (
                  <Form.Item
                    name={[field.name, 'spec']}
                    style={{ margin: 0 }}
                    rules={[{ max: 200 }]}
                  >
                    <Input placeholder="规格" size="small" />
                  </Form.Item>
                ),
              },
              {
                title: '数量',
                key: 'quantity',
                width: 90,
                render: (_: unknown, field: FieldType) => (
                  <Form.Item
                    name={[field.name, 'quantity']}
                    style={{ margin: 0 }}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: '100%' }}
                      size="small"
                      placeholder="0"
                    />
                  </Form.Item>
                ),
              },
              {
                title: '备注',
                key: 'remarks',
                render: (_: unknown, field: FieldType) => (
                  <Form.Item
                    name={[field.name, 'remarks']}
                    style={{ margin: 0 }}
                    rules={[{ max: 500 }]}
                  >
                    <Input placeholder="备注" size="small" />
                  </Form.Item>
                ),
              },
              {
                title: '',
                key: 'action',
                width: 40,
                render: (_: unknown, field: FieldType) => (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<XMarkIcon className="size-4" />}
                    onClick={() => remove(field.name)}
                  />
                ),
              },
            ]

            return (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    订单明细
                  </span>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusCircleIcon className="size-4" />}
                    onClick={() =>
                      add({
                        model: '',
                        name: '',
                        spec: '',
                        quantity: 0,
                        remarks: '',
                      })
                    }
                  >
                    添加明细
                  </Button>
                </div>
                {fields.length > 0 ? (
                  <Table
                    dataSource={fields}
                    columns={columns}
                    rowKey="key"
                    pagination={false}
                    size="small"
                    className="mb-2"
                  />
                ) : (
                  <div className="py-3 text-center text-sm text-gray-400">
                    暂无明细，可点击「添加明细」
                  </div>
                )}
              </div>
            )
          }}
        </Form.List>
      )}
    </Form>
  )
}
