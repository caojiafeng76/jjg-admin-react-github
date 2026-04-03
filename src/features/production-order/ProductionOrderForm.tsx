import { useEffect, useMemo, useState } from 'react'
import {
  App,
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
  DatePicker,
  Button,
  Card,
  Table,
  Space,
  Popconfirm,
  Empty,
  Tag,
  Switch,
} from 'antd'
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/16/solid'
import dayjs from 'dayjs'

import type {
  ProductionOrder,
  ProductionOrderShift,
} from '@/services/apiProductionOrders'
import type {
  ProductionOrderDataCategory,
  ProductionOrderItem,
} from '@/services/apiProductionOrderItems'
import {
  buildProjectNoSelectOptions,
  filterProjectNoOption,
  renderProjectNoOption,
} from './projectNoSelect'
import {
  useOperationsByModel,
  useSalesOrdersProjectNos,
} from './useProcessStandards'

type ProductionOrderFormInitialValues = ProductionOrder & {
  items?: ProductionOrderItem[]
}

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (values: {
    order: Partial<ProductionOrder>
    items: OrderItem[]
  }) => Promise<void> | void
  initialValues?: ProductionOrderFormInitialValues
  employees: { id: string; name: string }[]
  fixedEmployee?: { id: string; name: string } | null
  loading?: boolean
  compact?: boolean
  showAuditField?: boolean
}

interface OrderItem {
  id?: string
  data_category?: ProductionOrderDataCategory
  project_no: string
  product_model: string | null
  length_mm: number | null
  customer_model: string | null
  operation: string
  standard_seconds: number
  incoming_qualified_quantity: number
  qualified_quantity: number
  defect_reason_1: string | null
  defect_quantity_1: number
  defect_reason_2: string | null
  defect_quantity_2: number
  remark?: string | null
}

export default function ProductionOrderForm({
  open,
  onCancel,
  onSubmit,
  initialValues,
  employees,
  fixedEmployee,
  loading = false,
  compact = false,
  showAuditField = false,
}: Props) {
  const { modal } = App.useApp()
  const [form] = Form.useForm()
  const { data: projectNos, isLoading: loadingProjectNos } =
    useSalesOrdersProjectNos()

  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [itemForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const isCreateMode = !initialValues

  const selectedItemProductModel = Form.useWatch('product_model', itemForm)
  const selectedItemOperation = Form.useWatch('operation', itemForm)

  const { data: operations } = useOperationsByModel(
    selectedItemProductModel || undefined,
  )

  const operationOptions = useMemo(
    () =>
      operations?.map((item) => ({
        label: item.operation,
        value: item.operation,
      })) || [],
    [operations],
  )

  const modelsMap = useMemo(() => {
    const map: Record<
      string,
      {
        product_model: string | null
        length_mm: number | null
        customer_model: string | null
      }
    > = {}
    projectNos?.forEach((item) => {
      if (map[item.project_no]) {
        return
      }

      map[item.project_no] = {
        product_model: item.product_model,
        length_mm: item.length_mm,
        customer_model: item.customer_model,
      }
    })
    return map
  }, [projectNos])

  const projectNoOptions = useMemo(
    () => buildProjectNoSelectOptions(projectNos),
    [projectNos],
  )

  useEffect(() => {
    if (initialValues) {
      setItems(
        (initialValues.items || []).map((item) => ({
          id: item.id,
          data_category: item.data_category,
          project_no: item.project_no,
          product_model: item.product_model,
          length_mm: item.length_mm,
          customer_model: item.customer_model,
          operation: item.operation,
          standard_seconds: item.standard_seconds,
          incoming_qualified_quantity: item.incoming_qualified_quantity,
          qualified_quantity: item.qualified_quantity,
          defect_reason_1: item.defect_reason_1,
          defect_quantity_1: item.defect_quantity_1,
          defect_reason_2: item.defect_reason_2,
          defect_quantity_2: item.defect_quantity_2,
          remark: item.remark,
        })),
      )
      form.setFieldsValue({
        ...initialValues,
        is_audited: initialValues.is_audited,
        employee_id: initialValues.employee_id || fixedEmployee?.id,
        shift: initialValues.shift || '白班',
        order_date: initialValues.order_date
          ? dayjs(initialValues.order_date)
          : undefined,
      })
    } else {
      setItems([])
      form.resetFields()
      form.setFieldsValue({
        order_date: dayjs(),
        work_hours: 11,
        extra_qualified_hours: 0,
        is_audited: false,
        employee_id: fixedEmployee?.id,
        shift: '白班',
      })
    }
  }, [fixedEmployee, initialValues, form, open])

  useEffect(() => {
    const normalizedOperation =
      typeof selectedItemOperation === 'string'
        ? selectedItemOperation.trim()
        : ''

    if (!normalizedOperation) {
      return
    }

    const operationData = operations?.find(
      (item) => item.operation === normalizedOperation,
    )

    const currentStandardSeconds = itemForm.getFieldValue('standard_seconds')

    if (operationData) {
      if (currentStandardSeconds !== operationData.standard_seconds) {
        itemForm.setFieldsValue({
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
      itemForm.setFieldsValue({ standard_seconds: 0 })
    }
  }, [selectedItemOperation, operations, itemForm])

  const handleFinish = async (values: {
    order_date: dayjs.Dayjs
    work_hours: number
    extra_qualified_hours?: number
    remark?: string
    employee_id: string
    shift: ProductionOrderShift
    is_audited?: boolean
  }) => {
    setSubmitting(true)
    try {
      await onSubmit({
        order: {
          ...values,
          order_date: values.order_date.format('YYYY-MM-DD'),
        },
        items: [...items],
      })
      form.resetFields()
      setItems([])
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenItemModal = (index?: number) => {
    if (index !== undefined) {
      const item = items[index]
      setEditingItemIndex(index)
      itemForm.setFieldsValue({
        data_category: item?.data_category || 'A',
        project_no: item?.project_no,
        product_model: item?.product_model,
        length_mm: item?.length_mm,
        customer_model: item?.customer_model,
        operation: item?.operation,
        standard_seconds: item?.standard_seconds,
        incoming_qualified_quantity: item?.incoming_qualified_quantity ?? 0,
        qualified_quantity: item?.qualified_quantity || 0,
        defect_reason_1: item?.defect_reason_1 || '加工',
        defect_quantity_1: item?.defect_quantity_1 || 0,
        defect_reason_2: item?.defect_reason_2 || '原料',
        defect_quantity_2: item?.defect_quantity_2 || 0,
        remark: item?.remark || null,
      })
    } else {
      setEditingItemIndex(null)
      itemForm.resetFields()
      itemForm.setFieldsValue({
        data_category: 'A',
        incoming_qualified_quantity: 0,
        qualified_quantity: 0,
        defect_reason_1: '加工',
        defect_quantity_1: 0,
        defect_reason_2: '原料',
        defect_quantity_2: 0,
        remark: null,
      })
    }
    setIsItemModalOpen(true)
  }

  const handleItemFinish = async (values: OrderItem) => {
    const data = modelsMap[values.project_no]
    const operation = values.operation.trim()
    const productModel = data?.product_model ?? values.product_model ?? null

    const newItem: OrderItem = {
      id: editingItemIndex !== null ? items[editingItemIndex]?.id : undefined,
      data_category:
        values.data_category ||
        (editingItemIndex !== null
          ? items[editingItemIndex]?.data_category
          : undefined) ||
        'A',
      project_no: values.project_no,
      product_model: productModel,
      length_mm: data?.length_mm ?? values.length_mm ?? null,
      customer_model: data?.customer_model ?? values.customer_model ?? null,
      operation,
      standard_seconds: Number(
        values.standard_seconds ??
          itemForm.getFieldValue('standard_seconds') ??
          0,
      ),
      incoming_qualified_quantity:
        Number(values.incoming_qualified_quantity) || 0,
      qualified_quantity: values.qualified_quantity || 0,
      defect_reason_1: '加工',
      defect_quantity_1: Number(values.defect_quantity_1) || 0,
      defect_reason_2: '原料',
      defect_quantity_2: Number(values.defect_quantity_2) || 0,
      remark: values.remark || null,
    }

    if (editingItemIndex !== null) {
      setItems((prev) => {
        const next = [...prev]
        next[editingItemIndex] = newItem
        return next
      })
    } else {
      setItems((prev) => [...prev, newItem])
    }

    setIsItemModalOpen(false)
    itemForm.resetFields()
    setEditingItemIndex(null)
  }

  const handleItemModalCancel = () => {
    setIsItemModalOpen(false)
    itemForm.resetFields()
    setEditingItemIndex(null)
  }

  const handleProjectNoChangeForItem = (value: string) => {
    const data = modelsMap[value]
    if (data) {
      itemForm.setFieldsValue({
        product_model: data.product_model,
        length_mm: data.length_mm,
        customer_model: data.customer_model,
        operation: undefined,
        standard_seconds: undefined,
      })
    }
  }

  const handleOperationChangeForItem = (value: string) => {
    itemForm.setFieldsValue({
      operation: value,
    })

    const normalizedOperation = value.trim()
    const operationData = operations?.find(
      (item) => item.operation === normalizedOperation,
    )

    itemForm.setFieldsValue({
      standard_seconds: operationData?.standard_seconds ?? 0,
    })
  }

  const getPopupContainer = (triggerNode: HTMLElement) =>
    triggerNode.parentElement || document.body

  return (
    <>
      <Modal
        title={initialValues ? '编辑生产工单' : '创建生产工单'}
        open={open}
        onCancel={onCancel}
        onOk={() => form.submit()}
        okButtonProps={{ loading: submitting }}
        width={compact ? 'calc(100vw - 20px)' : 1200}
        style={compact ? { top: 12, maxWidth: 560 } : undefined}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{
            order_date: dayjs(),
            work_hours: 11,
            extra_qualified_hours: 0,
            is_audited: false,
            shift: '白班',
          }}
        >
          <div
            className={
              compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-4 gap-4'
            }
          >
            <Form.Item
              name="order_date"
              label="日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>

            <Form.Item
              name="employee_id"
              label="操作人"
              rules={[{ required: true, message: '请选择操作人' }]}
            >
              <Select
                showSearch
                placeholder="请选择操作人"
                optionFilterProp="children"
                disabled={Boolean(fixedEmployee)}
                filterOption={(input, option) => {
                  if (!option) return false
                  const label = option.label?.toString() ?? ''
                  return label.toLowerCase().includes(input.toLowerCase())
                }}
                options={employees.map((emp) => ({
                  label: emp.name,
                  value: emp.id,
                }))}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="shift"
              label="班别"
              rules={[{ required: true, message: '请选择班别' }]}
            >
              <Select
                placeholder="请选择班别"
                options={[
                  { label: '白班', value: '白班' },
                  { label: '夜班', value: '夜班' },
                ]}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="work_hours"
              label="出勤工时(小时)"
              rules={[{ required: true, message: '请输入出勤工时' }]}
            >
              <InputNumber
                min={0.01}
                step={0.5}
                style={{ width: '100%' }}
                placeholder="请输入出勤工时"
              />
            </Form.Item>

            <Form.Item
              name="extra_qualified_hours"
              label="零工工时(小时)"
              tooltip="按小时录入，会直接计入工单总合格工时"
            >
              <InputNumber
                min={0}
                step={0.5}
                precision={2}
                style={{ width: '100%' }}
                placeholder="例如 1.5"
              />
            </Form.Item>

            {showAuditField ? (
              <Form.Item
                name="is_audited"
                label="审核状态"
                valuePropName="checked"
              >
                <Switch checkedChildren="已审核" unCheckedChildren="待审核" />
              </Form.Item>
            ) : null}

            <Form.Item
              name="remark"
              label="备注"
              className={compact ? undefined : 'col-span-4'}
            >
              <Input.TextArea rows={2} placeholder="请输入备注" />
            </Form.Item>
          </div>

          {compact && isCreateMode ? (
            <section className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs tracking-[0.24em] text-slate-400 uppercase">
                    Process Items
                  </div>
                  <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    工序明细
                  </div>
                </div>
                <Button
                  type="primary"
                  icon={<PlusIcon className="h-4 w-4" />}
                  onClick={() => handleOpenItemModal()}
                >
                  添加
                </Button>
              </div>

              <div className="mt-4">
                {items.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="还没有工序明细，点击右上角开始添加"
                  />
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const shouldHighlight =
                        Number(item.standard_seconds || 0) === 0 &&
                        Number(item.qualified_quantity || 0) > 0

                      return (
                        <article
                          key={`${item.project_no}-${item.operation}-${index}`}
                          className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs tracking-[0.22em] text-slate-400 uppercase">
                                Step {index + 1}
                              </div>
                              <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                                {item.operation}
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                {item.project_no}
                                {item.product_model
                                  ? ` / ${item.product_model}`
                                  : ''}
                              </div>
                            </div>

                            <Tag
                              color={shouldHighlight ? 'error' : 'processing'}
                              className="mr-0 rounded-full px-3 py-1"
                            >
                              {shouldHighlight ? '需补标准工时' : '正常'}
                            </Tag>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                                来料接收数
                              </div>
                              <div className="mt-1 font-semibold text-slate-900">
                                {item.incoming_qualified_quantity}
                              </div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                                成品合格数
                              </div>
                              <div className="mt-1 font-semibold text-slate-900">
                                {item.qualified_quantity}
                              </div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                                加工不良
                              </div>
                              <div className="mt-1 font-semibold text-slate-900">
                                {item.defect_quantity_1 || 0}
                              </div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 px-3 py-3">
                              <div className="text-[11px] tracking-[0.18em] text-slate-400 uppercase">
                                原料不良
                              </div>
                              <div className="mt-1 font-semibold text-slate-900">
                                {item.defect_quantity_2 || 0}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button
                              type="primary"
                              className="flex-1"
                              icon={<PencilSquareIcon className="h-4 w-4" />}
                              onClick={() => handleOpenItemModal(index)}
                            >
                              编辑
                            </Button>
                            <Button
                              danger
                              className="flex-1"
                              icon={<TrashIcon className="h-4 w-4" />}
                              onClick={() => {
                                modal.confirm({
                                  title: '删除工序明细',
                                  content: `确认删除工序“${item.operation}”吗？`,
                                  okText: '删除',
                                  cancelText: '取消',
                                  okButtonProps: { danger: true },
                                  onOk: async () => {
                                    setItems((prev) =>
                                      prev.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                      ),
                                    )
                                  },
                                })
                              }}
                            >
                              删除
                            </Button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {!compact ? (
            <Card
              title="工序明细"
              size="small"
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusIcon className="h-4 w-4" />}
                  onClick={() => handleOpenItemModal()}
                >
                  添加工序
                </Button>
              }
            >
              <Table
                size="small"
                pagination={false}
                dataSource={items.map((item: OrderItem, index: number) => ({
                  ...item,
                  key: index,
                }))}
                rowKey="key"
                scroll={{ x: 1600 }}
                loading={loading}
                columns={[
                  {
                    title: '#',
                    width: 50,
                  },
                  {
                    title: '数据类别',
                    dataIndex: 'data_category',
                    width: 100,
                    render: (value?: ProductionOrderDataCategory) =>
                      value || 'A',
                  },
                  {
                    title: '项目号',
                    dataIndex: 'project_no',
                    width: 120,
                  },
                  {
                    title: '型号',
                    dataIndex: 'product_model',
                    width: 100,
                  },
                  {
                    title: '长度',
                    dataIndex: 'length_mm',
                    width: 80,
                  },
                  {
                    title: '客户型号',
                    dataIndex: 'customer_model',
                    width: 100,
                  },
                  {
                    title: '工序',
                    dataIndex: 'operation',
                    width: 100,
                    render: (value: string | string[]) => {
                      // 处理数组格式的旧数据
                      if (Array.isArray(value)) {
                        return value.join(', ')
                      }
                      return value
                    },
                  },
                  {
                    title: '标准工时(秒)',
                    dataIndex: 'standard_seconds',
                    width: 100,
                  },
                  {
                    title: '来料接收数',
                    dataIndex: 'incoming_qualified_quantity',
                    width: 100,
                  },
                  {
                    title: '成品合格数',
                    dataIndex: 'qualified_quantity',
                    width: 80,
                  },
                  {
                    title: '加工不良数量',
                    dataIndex: 'defect_quantity_1',
                    width: 100,
                    render: (value: number) => value || 0,
                  },
                  {
                    title: '原料不良数量',
                    dataIndex: 'defect_quantity_2',
                    width: 100,
                    render: (value: number) => value || 0,
                  },
                  {
                    title: '备注',
                    dataIndex: 'remark',
                    width: 150,
                    render: (value: string) => value || '',
                  },
                  {
                    title: '操作',
                    width: 100,
                    render: (
                      _: unknown,
                      record: OrderItem & { key: number },
                    ) => (
                      <Space size="small">
                        <Button
                          type="text"
                          size="small"
                          icon={<PencilSquareIcon className="h-4 w-4" />}
                          onClick={() => handleOpenItemModal(record.key)}
                        />
                        <Popconfirm
                          title="确定删除此工序明细吗？"
                          okText="确定"
                          cancelText="取消"
                          onConfirm={() => {
                            setItems((prev) =>
                              prev.filter((_, i) => i !== record.key),
                            )
                          }}
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<TrashIcon className="h-4 w-4" />}
                          />
                        </Popconfirm>
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          ) : null}
        </Form>
      </Modal>

      <Modal
        title={editingItemIndex !== null ? '编辑工序' : '添加工序'}
        open={isItemModalOpen}
        onOk={() => itemForm.submit()}
        onCancel={handleItemModalCancel}
        width={compact ? 'calc(100vw - 20px)' : 600}
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
            form={itemForm}
            layout="vertical"
            onFinish={handleItemFinish}
            initialValues={{
              incoming_qualified_quantity: 0,
              qualified_quantity: 0,
              defect_quantity_1: 0,
              defect_quantity_2: 0,
              remark: null,
            }}
          >
            {compact ? null : (
              <Form.Item
                name="data_category"
                label="数据类别"
                initialValue="A"
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
                options={projectNoOptions}
                filterOption={filterProjectNoOption}
                optionRender={renderProjectNoOption}
                listHeight={320}
                onChange={handleProjectNoChangeForItem}
              />
            </Form.Item>

            <div className="grid grid-cols-3 gap-4">
              <Form.Item name="product_model" label="型号">
                <Input disabled />
              </Form.Item>

              <Form.Item name="length_mm" label="长度(mm)">
                <Input disabled />
              </Form.Item>

              <Form.Item name="customer_model" label="客户型号">
                <Input disabled />
              </Form.Item>
            </div>

            <Form.Item
              name="operation"
              label="工序"
              rules={[{ required: true, message: '请选择工序' }]}
            >
              <Select
                showSearch
                placeholder="请选择工序"
                options={operationOptions}
                getPopupContainer={getPopupContainer}
                disabled={!selectedItemProductModel}
                filterOption={(input, option) => {
                  if (!option) return false
                  return (
                    option.value
                      ?.toString()
                      .toLowerCase()
                      .includes(input.toLowerCase()) ?? false
                  )
                }}
                onChange={handleOperationChangeForItem}
              />
            </Form.Item>

            {!compact ? (
              <Form.Item
                name="standard_seconds"
                label="标准工时(秒)"
                rules={[{ required: true, message: '请输入标准工时' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
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
                      throw new Error(
                        '来料接收数不能小于成品合格数与不良数之和',
                      )
                    }
                  },
                }),
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>

            <Form.Item
              name="qualified_quantity"
              label="成品合格数"
              rules={[{ required: true, message: '请输入成品合格数' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="加工不良数量" className="mb-2">
                <Form.Item name="defect_quantity_1" className="mb-0!">
                  <InputNumber
                    placeholder="数量"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form.Item>

              <Form.Item label="原料不良数量" className="mb-2">
                <Form.Item name="defect_quantity_2" className="mb-0!">
                  <InputNumber
                    placeholder="数量"
                    min={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form.Item>
            </div>

            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="请输入备注" />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </>
  )
}
