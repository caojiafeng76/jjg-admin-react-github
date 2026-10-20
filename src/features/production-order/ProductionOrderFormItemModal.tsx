import type { FormInstance } from 'antd'
import type { OrderItem } from './productionOrderFormTypes'
import type { ScannedProjectPayload } from './ProjectNoScanButton'
import type { buildProjectNoSelectOptions } from './projectNoSelect'
import type {
  ProcessStandardMatchLevel,
  useSalesOrdersProjectNos,
} from './useProcessStandards'
import { Form, Input, InputNumber, Modal, Select, Space, Tag } from 'antd'
import {
  ITEM_FORM_INITIAL_VALUES,
  MATCH_LEVEL_COLORS,
  MATCH_LEVEL_LABELS,

} from './productionOrderFormTypes'
import ProjectNoScanButton from './ProjectNoScanButton'
import { filterProjectNoOption, renderProjectNoOption } from './projectNoSelect'

export interface ProductionOrderMachineOption {
  id: string | null
  unified_device_no: string | null
  operation: string | null
  machine_name: string | null
}

export interface ProductionOrderFormItemModalProps {
  compact: boolean
  editingItemIndex: number | null
  filteredMachineOptions: ProductionOrderMachineOption[]
  hideCostColumns: boolean
  isOperationSelected: boolean
  isProductModelSelected: boolean
  itemForm: FormInstance
  loadingProjectNos: boolean
  mergedProjectNoOptions: ReturnType<typeof buildProjectNoSelectOptions>
  onCancel: () => void
  onFinish: (values: OrderItem) => void | Promise<void>
  onOperationChange: (value: string) => void
  onProjectNoChange: (value: string) => void
  onProjectNoScanResolved: (payload: ScannedProjectPayload) => void
  open: boolean
  operationMatchLevel: ProcessStandardMatchLevel | null
  operationOptions: { label: string, value: string }[]
  projectNos: ReturnType<typeof useSalesOrdersProjectNos>['data']
}

export default function ProductionOrderFormItemModal({
  compact,
  editingItemIndex,
  filteredMachineOptions,
  hideCostColumns,
  isOperationSelected,
  isProductModelSelected,
  itemForm,
  loadingProjectNos,
  mergedProjectNoOptions,
  onCancel,
  onFinish,
  onOperationChange,
  onProjectNoChange,
  onProjectNoScanResolved,
  open,
  operationMatchLevel,
  operationOptions,
  projectNos,
}: ProductionOrderFormItemModalProps) {
  const getPopupContainer = (triggerNode: HTMLElement) =>
    triggerNode.parentElement || document.body

  return (
    <Modal
      title={editingItemIndex !== null ? '编辑工序' : '添加工序'}
      open={open}
      onOk={() => itemForm.submit()}
      onCancel={onCancel}
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
          onFinish={onFinish}
          initialValues={ITEM_FORM_INITIAL_VALUES}
        >
          {compact || hideCostColumns
            ? null
            : (
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

          <Form.Item label="项目号" required>
            <Space.Compact block>
              <Form.Item
                name="project_no"
                noStyle
                rules={[{ required: true, message: '请选择项目号' }]}
              >
                <Select
                  showSearch
                  placeholder="请选择项目号"
                  loading={loadingProjectNos}
                  getPopupContainer={getPopupContainer}
                  options={mergedProjectNoOptions}
                  filterOption={filterProjectNoOption}
                  optionRender={renderProjectNoOption}
                  listHeight={320}
                  onChange={onProjectNoChange}
                />
              </Form.Item>
              <ProjectNoScanButton
                projectNos={projectNos}
                onResolved={onProjectNoScanResolved}
              />
            </Space.Compact>
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
              disabled={!isProductModelSelected}
              filterOption={(input, option) => {
                if (!option)
                  return false
                return (
                  option.value
                    ?.toString()
                    .toLowerCase()
                    .includes(input.toLowerCase()) ?? false
                )
              }}
              onChange={onOperationChange}
            />
          </Form.Item>

          {isProductModelSelected && operationMatchLevel
            ? (
                <div className="-mt-3 mb-4 text-sm text-slate-600 dark:text-slate-400">
                  成本核算匹配：
                  <Tag
                    color={MATCH_LEVEL_COLORS[operationMatchLevel]}
                    className="mr-0 ml-2"
                  >
                    {MATCH_LEVEL_LABELS[operationMatchLevel]}
                  </Tag>
                </div>
              )
            : null}

          <Form.Item
            name="machine_equipment_id"
            label="机器编号"
            rules={[
              {
                validator: async (_, value) => {
                  if (value === undefined) {
                    throw new Error('请选择机器编号')
                  }
                },
              },
            ]}
          >
            <Select
              showSearch
              placeholder="请选择机器编号"
              getPopupContainer={getPopupContainer}
              disabled={!isOperationSelected}
              optionLabelProp="label"
              filterOption={(input, option) => {
                if (!option)
                  return false
                const search = input.toLowerCase()
                return (
                  (option.unified_device_no as string)
                    ?.toLowerCase()
                    .includes(search)
                    || (option.operation as string)
                      ?.toLowerCase()
                      .includes(search)
                      || (option.machine_name as string)
                        ?.toLowerCase()
                        .includes(search)
                )
              }}
              style={{ width: '100%' }}
            >
              {filteredMachineOptions.map(m => (
                <Select.Option
                  key={m.id ?? '__none__'}
                  value={m.id}
                  label={m.id === null ? '无' : m.unified_device_no}
                  unified_device_no={m.unified_device_no}
                  operation={m.operation}
                  machine_name={m.machine_name}
                >
                  {m.id === null
                    ? (
                        <span className="text-slate-400 dark:text-slate-500">
                          无
                        </span>
                      )
                    : (
                        <div className="flex flex-col py-0.5">
                          <span>{m.unified_device_no}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {m.operation} {m.machine_name}
                          </span>
                        </div>
                      )}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="theoretical_seconds" hidden>
            <Input />
          </Form.Item>

          {!compact && !hideCostColumns
            ? (
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
              )
            : null}

          <Form.Item
            name="incoming_qualified_quantity"
            label="来料接收数"
            dependencies={[
              'qualified_quantity',
              'defect_quantity_1',
              'defect_quantity_2',
              'outsource_defect_quantity',
              'setup_defect_quantity',
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
                  const outsourceDefectQuantity = Number(
                    getFieldValue('outsource_defect_quantity') || 0,
                  )
                  const setupDefectQuantity = Number(
                    getFieldValue('setup_defect_quantity') || 0,
                  )
                  const minimumQuantity
                    = qualifiedQuantity
                      + defectQuantity1
                      + defectQuantity2
                      + outsourceDefectQuantity
                      + setupDefectQuantity

                  if (incomingQualifiedQuantity < minimumQuantity) {
                    throw new Error('来料接收数不能小于成品合格数与不良数之和')
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

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Form.Item label="调机不良" className="mb-2">
              <Form.Item name="setup_defect_quantity" className="mb-0!">
                <InputNumber
                  placeholder="数量"
                  min={0}
                  precision={0}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Form.Item>

            <Form.Item name="setup_responsible" label="调机负责人">
              <Input placeholder="请输入调机负责人" />
            </Form.Item>
          </div>

          <div className="mb-4 rounded-2xl border border-red-300 bg-red-50/60 p-4 dark:border-red-900/60 dark:bg-red-950/40">
            <div className="mb-3 text-sm font-medium text-red-600 dark:text-red-400">
              外协相关信息
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Form.Item label="外协不良数" className="mb-2">
                <Form.Item name="outsource_defect_quantity" className="mb-0!">
                  <InputNumber
                    placeholder="数量"
                    min={0}
                    precision={0}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Form.Item>

              <Form.Item name="outsource_unit" label="外协单位">
                <Input placeholder="请输入外协单位" />
              </Form.Item>

              <Form.Item
                name="outsource_defect_reason"
                label="外协不良原因"
                className="md:col-span-2"
              >
                <Input.TextArea rows={2} placeholder="请输入外协不良原因" />
              </Form.Item>
            </div>
          </div>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
