import { useEffect, useMemo, useState } from 'react'
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

import {
  calculateActualOutputWeight,
  calculateBilletInputWeight,
  calculateMaterialYield,
  calculateTheoreticalOutputCount,
  calculateTheoreticalOutputWeight,
} from '@/utils/extrusionCalculations'
import { buildProjectNoSelectOptions, filterProjectNoOption, renderProjectNoOption } from '@/features/production-order/projectNoSelect'
import { useMachineEquipmentOptions } from '@/features/production-order/useMachineEquipmentOptions'
import type {
  ExtrusionProduction,
  ExtrusionProductionItemInput,
  UpsertExtrusionProductionPayload,
} from '@/services/apiExtrusionProductions'
import {
  useExtrusionSalesOrdersProjectNos,
} from './useExtrusionProductions'
import ExtrusionProductionItemTable from './ExtrusionProductionItemTable'
import { buildExtrusionMachineOptions } from './extrusionMachineOptions'

interface Props {
  open: boolean
  onCancel: () => void
  onSubmit: (values: UpsertExtrusionProductionPayload) => Promise<void> | void
  initialValues?: ExtrusionProduction | null
  loading?: boolean
  currentUploader?: string | null
  canAudit?: boolean
}

interface HeaderFormValues {
  production_date: Dayjs | null
  machine_id: string
  shift: string
  shift_leader_name: string
  uploaded_by_name?: string | null
  remark?: string | null
  is_audited?: boolean
}

type ItemFormValues = ExtrusionProductionItemInput

const SHIFT_OPTIONS = [
  { label: '白班', value: '白班' },
  { label: '夜班', value: '夜班' },
]

const SHIFT_LEADER_OPTIONS = [
  { label: '姚兴弟', value: '姚兴弟' },
  { label: '蒋天恩', value: '蒋天恩' },
  { label: '陈国明', value: '陈国明' },
  { label: '李成', value: '李成' },
]

const EMPTY_ITEM_DEFAULTS: Partial<ItemFormValues> = {
  actual_quantity: 0,
  scrap_weight_kg: 0,
  tailing_weight_kg: 0,
}

export default function ExtrusionProductionForm({
  open,
  onCancel,
  onSubmit,
  initialValues,
  loading = false,
  currentUploader = null,
  canAudit = true,
}: Props) {
  const { message } = App.useApp()
  const [headerForm] = Form.useForm<HeaderFormValues>()
  const [itemForm] = Form.useForm<ItemFormValues>()
  const { data: projectNos, isLoading: isLoadingProjectNos } =
    useExtrusionSalesOrdersProjectNos()
  const { data: machines, isLoading: isLoadingMachines } =
    useMachineEquipmentOptions()
  const [items, setItems] = useState<ExtrusionProductionItemInput[]>([])
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)

  const projectNoOptions = useMemo(
    () => buildProjectNoSelectOptions(projectNos),
    [projectNos],
  )

  const projectInfoMap = useMemo(() => {
    return new Map((projectNos || []).map((item) => [item.project_no, item]))
  }, [projectNos])

  const machineSelectOptions = useMemo(
    () => buildExtrusionMachineOptions(machines),
    [machines],
  )

  const watchedOrderLengthMm = Form.useWatch('order_length_mm', itemForm)
  const watchedActualOutputLengthMm = Form.useWatch('actual_output_length_mm', itemForm)
  const watchedActualQuantity = Form.useWatch('actual_quantity', itemForm)
  const watchedUnitWeight = Form.useWatch(
    'theoretical_unit_weight_kg_per_meter',
    itemForm,
  )
  const watchedActualUnitWeight = Form.useWatch('actual_unit_weight_kg', itemForm)
  const watchedBilletDiameterMm = Form.useWatch('billet_diameter_mm', itemForm)
  const watchedBilletLengthMm = Form.useWatch('billet_length_mm', itemForm)
  const watchedBilletQuantity = Form.useWatch('billet_quantity', itemForm)

  const billetInputWeightPreview = calculateBilletInputWeight({
    billetDiameterMm: watchedBilletDiameterMm,
    billetLengthMm: watchedBilletLengthMm,
    billetQuantity: watchedBilletQuantity,
  })

  const theoreticalOutputCountPreview = calculateTheoreticalOutputCount({
    actualLengthMm: watchedActualOutputLengthMm,
    orderLengthMm: watchedOrderLengthMm,
    actualQuantity: watchedActualQuantity,
  })

  const theoreticalOutputWeightPreview = calculateTheoreticalOutputWeight({
    theoreticalOutputCount: theoreticalOutputCountPreview,
    orderLengthMm: watchedOrderLengthMm,
    theoreticalUnitWeightKgPerMeter: watchedUnitWeight,
  })

  const actualOutputWeightPreview = calculateActualOutputWeight({
    actualQuantity: watchedActualQuantity,
    actualUnitWeightKg: watchedActualUnitWeight,
  })

  const materialYieldPreview = calculateMaterialYield({
    actualOutputWeightKg: actualOutputWeightPreview,
    inputWeightKg: billetInputWeightPreview,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    if (initialValues) {
      headerForm.setFieldsValue({
        production_date: initialValues.production_date
          ? dayjs(initialValues.production_date)
          : null,
        machine_id: initialValues.machine_id,
        shift: initialValues.shift,
        shift_leader_name: initialValues.shift_leader_name,
        uploaded_by_name: initialValues.uploaded_by_name || undefined,
        remark: initialValues.remark || undefined,
        is_audited: initialValues.is_audited,
      })
      setItems(initialValues.extrusion_production_items || [])
      return
    }

    headerForm.resetFields()
    itemForm.resetFields()
    setItems([])
    headerForm.setFieldsValue({
      uploaded_by_name: currentUploader || undefined,
      is_audited: false,
      shift: '白班',
    })
  }, [currentUploader, headerForm, initialValues, itemForm, open])

  function handleProjectChange(projectNo: string) {
    const project = projectInfoMap.get(projectNo)

    itemForm.setFieldsValue({
      project_no: projectNo,
      product_model: project?.product_model || undefined,
      customer: project?.customer || undefined,
      customer_model: project?.customer_model || undefined,
      material_name: project?.material_code || undefined,
      order_length_mm: project?.length_mm ?? undefined,
      theoretical_unit_weight_kg_per_meter:
        project?.weight_per_meter_kg ?? undefined,
    })
  }

  function openCreateItemModal() {
    setEditingItemIndex(null)
    itemForm.resetFields()
    itemForm.setFieldsValue(EMPTY_ITEM_DEFAULTS)
    setItemModalOpen(true)
  }

  function openEditItemModal(index: number) {
    const target = items[index]
    if (!target) {
      return
    }

    setEditingItemIndex(index)
    itemForm.setFieldsValue(target)
    setItemModalOpen(true)
  }

  function handleDeleteItem(index: number) {
    setItems((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  async function handleSaveItem() {
    const values = await itemForm.validateFields()
    const nextItem: ExtrusionProductionItemInput = {
      ...values,
      billet_input_weight_kg: billetInputWeightPreview,
      theoretical_output_count: theoreticalOutputCountPreview,
      theoretical_output_weight_kg: theoreticalOutputWeightPreview,
      actual_output_weight_kg: actualOutputWeightPreview,
      material_yield: materialYieldPreview,
    }

    setItems((prev) => {
      if (editingItemIndex === null) {
        return [...prev, nextItem]
      }

      return prev.map((item, index) =>
        index === editingItemIndex ? nextItem : item,
      )
    })

    setItemModalOpen(false)
    setEditingItemIndex(null)
  }

  async function handleFinish() {
    const headerValues = await headerForm.validateFields()

    if (items.length === 0) {
      message.warning('请至少添加一条明细')
      return
    }

    const headerPayload = {
      ...headerValues,
      production_date: headerValues.production_date
        ? headerValues.production_date.format('YYYY-MM-DD')
        : '',
      uploaded_by_name: currentUploader || headerValues.uploaded_by_name || null,
      remark: headerValues.remark || null,
      is_audited: canAudit ? (headerValues.is_audited ?? false) : false,
    }

    await onSubmit({
      header: headerPayload,
      items: items.map((item, index) => ({
        ...item,
        sort_order: index,
      })),
    })
  }

  return (
    <>
      <Modal
        title={initialValues ? '编辑挤压生产单' : '创建挤压生产单'}
        open={open}
        onCancel={onCancel}
        width={1100}
        footer={null}
        destroyOnHidden
      >
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          <Form form={headerForm} layout="vertical" onFinish={handleFinish}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Form.Item
                name="production_date"
                label="生产日期"
                rules={[{ required: true, message: '请选择生产日期' }]}
              >
                <DatePicker format="YYYY-MM-DD" placeholder="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item
                name="machine_id"
                label="设备"
                rules={[{ required: true, message: '请选择设备' }]}
              >
                <Select
                  showSearch
                  options={machineSelectOptions}
                  loading={isLoadingMachines}
                  placeholder="请选择设备"
                  optionFilterProp="label"
                />
              </Form.Item>

              <Form.Item
                name="shift"
                label="班别"
                rules={[{ required: true, message: '请选择班别' }]}
              >
                <Select options={SHIFT_OPTIONS} placeholder="请选择班别" />
              </Form.Item>

              <Form.Item
                name="shift_leader_name"
                label="班组长"
                rules={[{ required: true, message: '请选择班组长' }]}
              >
                <Select options={SHIFT_LEADER_OPTIONS} placeholder="请选择班组长" />
              </Form.Item>

              <Form.Item name="uploaded_by_name" label="上传人">
                <Input placeholder="上传人" />
              </Form.Item>

              <Form.Item name="is_audited" label="审核" valuePropName="checked">
                <Switch disabled={!canAudit} checkedChildren="已审核" unCheckedChildren="待审核" />
              </Form.Item>
            </div>

            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="可填写整单备注" />
            </Form.Item>

            <ExtrusionProductionItemTable
              data={items}
              onAdd={openCreateItemModal}
              onEdit={openEditItemModal}
              onDelete={handleDeleteItem}
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={onCancel}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <Modal
        title={editingItemIndex === null ? '添加挤压明细' : '编辑挤压明细'}
        open={itemModalOpen}
        onCancel={() => setItemModalOpen(false)}
        onOk={handleSaveItem}
        width={920}
        destroyOnHidden
      >
        <Form form={itemForm} layout="vertical">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Form.Item
              name="project_no"
              label="项目号"
              rules={[{ required: true, message: '请选择项目号' }]}
            >
              <Select
                showSearch
                placeholder="请选择项目号"
                loading={isLoadingProjectNos}
                options={projectNoOptions}
                filterOption={filterProjectNoOption}
                optionRender={renderProjectNoOption}
                listHeight={320}
                onChange={handleProjectChange}
              />
            </Form.Item>

            <Form.Item name="product_model" label="型号">
              <Input disabled placeholder="自动带出" />
            </Form.Item>

            <Form.Item name="customer" label="客户">
              <Input disabled placeholder="自动带出" />
            </Form.Item>

            <Form.Item name="customer_model" label="客户型号">
              <Input disabled placeholder="自动带出" />
            </Form.Item>

            <Form.Item name="material_name" label="材质">
              <Input disabled placeholder="自动带出" />
            </Form.Item>

            <Form.Item
              name="order_length_mm"
              label="订单长度(mm)"
              rules={[{ required: true, message: '请输入订单长度' }]}
            >
              <InputNumber
                data-testid="input-order-length"
                className="w-full"
                min={1}
              />
            </Form.Item>

            <Form.Item
              name="theoretical_unit_weight_kg_per_meter"
              label="比重(kg/m)"
            >
              <InputNumber
                data-testid="input-theory-weight"
                className="w-full"
                disabled
                placeholder="选择项目号后自动带出"
              />
            </Form.Item>

            <Form.Item name="die_no" label="模具号">
              <Input placeholder="请输入模具号" />
            </Form.Item>

            <Form.Item
              name="billet_diameter_mm"
              label="铝棒直径(mm)"
              rules={[{ required: true, message: '请输入铝棒直径' }]}
            >
              <InputNumber
                data-testid="input-billet-diameter"
                className="w-full"
                min={0.0001}
              />
            </Form.Item>

            <Form.Item
              name="billet_length_mm"
              label="铝棒长度(mm)"
              rules={[{ required: true, message: '请输入铝棒长度' }]}
            >
              <InputNumber
                data-testid="input-billet-length"
                className="w-full"
                min={0.0001}
              />
            </Form.Item>

            <Form.Item
              name="billet_quantity"
              label="铝棒数量"
              rules={[{ required: true, message: '请输入铝棒数量' }]}
            >
              <InputNumber
                data-testid="input-billet-quantity"
                className="w-full"
                min={1}
                precision={0}
              />
            </Form.Item>

            <Form.Item
              name="billet_input_weight_kg"
              label="铝棒投入重量(kg)"
            >
              <InputNumber
                data-testid="input-billet-weight"
                className="w-full"
                disabled
                placeholder="根据直径、长度、数量自动计算"
              />
            </Form.Item>

            <Form.Item
              name="actual_output_length_mm"
              label="实际产出长度(mm)"
              rules={[{ required: true, message: '请输入实际产出长度' }]}
            >
              <InputNumber
                data-testid="input-actual-length"
                className="w-full"
                min={0.0001}
              />
            </Form.Item>

            <Form.Item
              name="actual_unit_weight_kg"
              label="实际支重(kg)"
              rules={[{ required: true, message: '请输入实际支重' }]}
            >
              <InputNumber
                data-testid="input-actual-weight"
                className="w-full"
                min={0.0001}
              />
            </Form.Item>

            <Form.Item
              name="actual_quantity"
              label="实际数量"
              rules={[{ required: true, message: '请输入实际数量' }]}
            >
              <InputNumber
                data-testid="input-actual-quantity"
                className="w-full"
                min={0}
                precision={0}
              />
            </Form.Item>

            <Form.Item name="scrap_weight_kg" label="废料重量(kg)">
              <InputNumber
                data-testid="input-scrap-weight"
                className="w-full"
                min={0}
              />
            </Form.Item>

            <Form.Item name="tailing_weight_kg" label="压余重量(kg)">
              <InputNumber
                data-testid="input-tailing-weight"
                className="w-full"
                min={0}
              />
            </Form.Item>
          </div>

          <div className="mt-2 grid grid-cols-1 gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 p-4 md:grid-cols-5">
            <div>
              <div className="text-xs text-slate-500">铝棒投入重量(kg)</div>
              <div className="text-base font-semibold" data-testid="preview-billet-weight">
                {billetInputWeightPreview.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">理论支数</div>
              <div className="text-base font-semibold" data-testid="preview-theoretical-count">
                {theoreticalOutputCountPreview}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">理论支重(kg)</div>
              <div className="text-base font-semibold" data-testid="preview-theoretical-weight">
                {theoreticalOutputWeightPreview.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">实际产出重量(kg)</div>
              <div className="text-base font-semibold" data-testid="preview-actual-weight">
                {actualOutputWeightPreview.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">成材率(%)</div>
              <div className="text-base font-semibold" data-testid="preview-yield">
                {materialYieldPreview.toFixed(2)}
              </div>
            </div>
          </div>

          <Form.Item name="remark" label="备注" className="mt-3">
            <Input.TextArea rows={2} placeholder="可填写明细备注" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
