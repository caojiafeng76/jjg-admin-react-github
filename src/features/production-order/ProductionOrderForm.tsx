import { useCallback, useEffect, useMemo, useState } from 'react'
import { Form, Modal } from 'antd'
import dayjs from 'dayjs'

import type { ProductionOrderShift } from '@/services/apiProductionOrders'
import { buildProjectNoSelectOptions } from './projectNoSelect'
import type { ScannedProjectPayload } from './ProjectNoScanButton'
import {
  useOperationsByModel,
  useSalesOrdersProjectNos,
  useSalesOrderByProjectNo,
} from './useProcessStandards'
import { useMachineEquipmentOptions } from './useMachineEquipmentOptions'
import { useAuth } from '@/contexts/useAuth'
import { isViewerRole } from '@/config/access'
import ProductionOrderFormBaseFields from './ProductionOrderFormBaseFields'
import ProductionOrderFormItemModal from './ProductionOrderFormItemModal'
import ProductionOrderFormItemsMobileList from './ProductionOrderFormItemsMobileList'
import ProductionOrderFormItemsTable from './ProductionOrderFormItemsTable'
import {
  type OrderItem,
  type ProductionOrderFormProps,
  type ProjectNoData,
} from './productionOrderFormTypes'
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
}: ProductionOrderFormProps) {
  const [form] = Form.useForm()
  const { data: projectNos, isLoading: loadingProjectNos } =
    useSalesOrdersProjectNos()
  const { role } = useAuth()
  const hideCostColumns = isViewerRole(role)
  const [scannedProjectDataMap, setScannedProjectDataMap] = useState<
    Record<string, ProjectNoData>
  >({})

  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [itemForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const isCreateMode = !initialValues

  const orderFormInitialValues = useMemo(
    () => ({
      order_date: dayjs(),
      work_hours: 11,
      extra_qualified_hours: 0,
      is_audited: false,
      shift: '白班',
    }),
    [],
  )

  const selectedItemProductModel = Form.useWatch('product_model', itemForm)
  const selectedItemProjectNo = Form.useWatch('project_no', itemForm)
  const selectedItemOperation = Form.useWatch('operation', itemForm)

  const { data: machineOptions } = useMachineEquipmentOptions()

  const modelsMap = useMemo(() => {
    const map: Record<string, ProjectNoData> = {}
    projectNos?.forEach((item) => {
      if (map[item.project_no]) {
        return
      }

      map[item.project_no] = {
        product_model: item.product_model,
        length_mm: item.length_mm,
        material_code: item.material_code,
        customer_model: item.customer_model,
      }
    })
    return map
  }, [projectNos])

  const projectNoOptions = useMemo(
    () => buildProjectNoSelectOptions(projectNos),
    [projectNos],
  )
  const mergedProjectNoOptions = useMemo(() => {
    const existingProjectNos = new Set(
      projectNoOptions.map((item) => item.value),
    )
    const scannedProjectNos = Object.entries(scannedProjectDataMap)
      .filter(([projectNo]) => !existingProjectNos.has(projectNo))
      .map(([project_no, item]) => ({
        project_no,
        product_model: item.product_model,
        length_mm: item.length_mm,
        customer_model: item.customer_model,
      }))

    return buildProjectNoSelectOptions([
      ...(projectNos || []),
      ...scannedProjectNos,
    ])
  }, [projectNoOptions, projectNos, scannedProjectDataMap])

  const selectedProjectData = selectedItemProjectNo
    ? (modelsMap[selectedItemProjectNo] ??
      scannedProjectDataMap[selectedItemProjectNo])
    : undefined

  const { data: selectedSalesOrderDetail } = useSalesOrderByProjectNo(
    selectedItemProjectNo || undefined,
  )

  const resolvedSelectedProjectData =
    selectedProjectData ?? selectedSalesOrderDetail

  const { data: operationMatch } = useOperationsByModel({
    model: selectedItemProductModel || undefined,
    length: resolvedSelectedProjectData?.length_mm,
    partNo: resolvedSelectedProjectData?.material_code,
  })

  const operations = operationMatch?.records
  const operationMatchLevel = operationMatch?.matchLevel ?? null

  const operationOptions = useMemo(
    () =>
      operations?.map((item) => ({
        label: item.operation,
        value: item.operation,
      })) || [],
    [operations],
  )

  const filteredMachineOptions = useMemo(() => {
    const opts = machineOptions || []
    return [
      {
        id: null as string | null,
        unified_device_no: '无',
        operation: '',
        machine_name: '',
      },
      ...opts,
    ]
  }, [machineOptions])

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
          outsource_defect_quantity: item.outsource_defect_quantity ?? 0,
          outsource_defect_reason: item.outsource_defect_reason,
          outsource_unit: item.outsource_unit,
          setup_defect_quantity: item.setup_defect_quantity ?? 0,
          setup_responsible: item.setup_responsible,
          remark: item.remark,
          theoretical_seconds: item.theoretical_seconds ?? 0,
          machine_equipment_id: item.machine_equipment_id ?? null,
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
      setScannedProjectDataMap({})
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
          theoretical_seconds: operationData.theoretical_seconds ?? 0,
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

  const handleFinish = useCallback(
    async (values: {
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
    },
    [onSubmit, items, form],
  )

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
        machine_equipment_id: item?.machine_equipment_id,
        incoming_qualified_quantity: item?.incoming_qualified_quantity ?? 0,
        qualified_quantity: item?.qualified_quantity || 0,
        defect_reason_1: item?.defect_reason_1 || '加工',
        defect_quantity_1: item?.defect_quantity_1 || 0,
        defect_reason_2: item?.defect_reason_2 || '原料',
        defect_quantity_2: item?.defect_quantity_2 || 0,
        outsource_defect_quantity: item?.outsource_defect_quantity || 0,
        outsource_defect_reason: item?.outsource_defect_reason || null,
        outsource_unit: item?.outsource_unit || null,
        setup_defect_quantity: item?.setup_defect_quantity || 0,
        setup_responsible: item?.setup_responsible || null,
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
        outsource_defect_quantity: 0,
        outsource_defect_reason: null,
        outsource_unit: null,
        setup_defect_quantity: 0,
        setup_responsible: null,
        remark: null,
      })
    }
    setIsItemModalOpen(true)
  }

  const handleItemFinish = useCallback(
    async (values: OrderItem) => {
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
        theoretical_seconds: Number(
          values.theoretical_seconds ??
            itemForm.getFieldValue('theoretical_seconds') ??
            0,
        ),
        machine_equipment_id: values.machine_equipment_id ?? null,
        incoming_qualified_quantity:
          Number(values.incoming_qualified_quantity) || 0,
        qualified_quantity: values.qualified_quantity || 0,
        defect_reason_1: '加工',
        defect_quantity_1: Number(values.defect_quantity_1) || 0,
        defect_reason_2: '原料',
        defect_quantity_2: Number(values.defect_quantity_2) || 0,
        outsource_defect_quantity:
          Number(values.outsource_defect_quantity) || 0,
        outsource_defect_reason: values.outsource_defect_reason?.trim() || null,
        outsource_unit: values.outsource_unit?.trim() || null,
        setup_defect_quantity: Number(values.setup_defect_quantity) || 0,
        setup_responsible: values.setup_responsible?.trim() || null,
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
    },
    [modelsMap, itemForm, editingItemIndex, items],
  )

  const handleItemModalCancel = () => {
    setIsItemModalOpen(false)
    itemForm.resetFields()
    setEditingItemIndex(null)
  }

  const handleProjectNoChangeForItem = (value: string) => {
    const data = modelsMap[value] ?? scannedProjectDataMap[value]
    if (data) {
      itemForm.setFieldsValue({
        product_model: data.product_model,
        length_mm: data.length_mm,
        customer_model: data.customer_model,
        operation: undefined,
        standard_seconds: undefined,
        theoretical_seconds: undefined,
        machine_equipment_id: undefined,
      })
    }
  }

  const handleProjectNoScanResolvedForItem = (
    payload: ScannedProjectPayload,
  ) => {
    const nextProjectData: ProjectNoData = {
      product_model: payload.productModel,
      length_mm: payload.lengthMm,
      material_code: payload.materialCode,
      customer_model: payload.customerModel,
    }

    setScannedProjectDataMap((prev) => ({
      ...prev,
      [payload.projectNo]: nextProjectData,
    }))

    itemForm.setFieldsValue({
      project_no: payload.projectNo,
      product_model: payload.productModel,
      length_mm: payload.lengthMm,
      customer_model: payload.customerModel,
      operation: undefined,
      standard_seconds: undefined,
      theoretical_seconds: undefined,
      machine_equipment_id: undefined,
    })
  }

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
  }

  const handleOperationChangeForItem = (value: string) => {
    const normalizedOperation = value.trim()
    const operationData = operations?.find(
      (item) => item.operation === normalizedOperation,
    )

    itemForm.setFieldsValue({
      operation: value,
      standard_seconds: operationData?.standard_seconds ?? 0,
      theoretical_seconds: operationData?.theoretical_seconds ?? 0,
      machine_equipment_id: undefined,
    })
  }

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
          initialValues={orderFormInitialValues}
        >
          <ProductionOrderFormBaseFields
            compact={compact}
            employees={employees}
            fixedEmployee={fixedEmployee}
            showAuditField={showAuditField}
          />
          {compact && isCreateMode ? (
            <ProductionOrderFormItemsMobileList
              items={items}
              onAdd={() => handleOpenItemModal()}
              onDelete={handleDeleteItem}
              onEdit={handleOpenItemModal}
            />
          ) : null}
          {!compact ? (
            <ProductionOrderFormItemsTable
              hideCostColumns={hideCostColumns}
              items={items}
              loading={loading}
              onAdd={() => handleOpenItemModal()}
              onDelete={handleDeleteItem}
              onEdit={handleOpenItemModal}
            />
          ) : null}{' '}
        </Form>
      </Modal>
      <ProductionOrderFormItemModal
        compact={compact}
        editingItemIndex={editingItemIndex}
        filteredMachineOptions={filteredMachineOptions}
        hideCostColumns={hideCostColumns}
        isOperationSelected={Boolean(selectedItemOperation)}
        isProductModelSelected={Boolean(selectedItemProductModel)}
        itemForm={itemForm}
        loadingProjectNos={loadingProjectNos}
        mergedProjectNoOptions={mergedProjectNoOptions}
        onCancel={handleItemModalCancel}
        onFinish={handleItemFinish}
        onOperationChange={handleOperationChangeForItem}
        onProjectNoChange={handleProjectNoChangeForItem}
        onProjectNoScanResolved={handleProjectNoScanResolvedForItem}
        open={isItemModalOpen}
        operationMatchLevel={operationMatchLevel}
        operationOptions={operationOptions}
        projectNos={projectNos}
      />{' '}
    </>
  )
}
