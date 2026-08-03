import { useEffect } from 'react'
import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Tag,
  type FormInstance,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

import type {
  ToolingFixture,
  ToolingFixtureFormValues,
} from '@/services/apiToolingFixture'
import { TOOLING_FIXTURE_LIFECYCLES } from './fixtureDomain'
import { TOOLING_FIXTURE_FORM_FIELDS } from './fixtureFormFields'

interface ToolingFixtureFormProps {
  onFinish: (values: ToolingFixtureFormValues) => void
  setFormRef: (form: FormInstance<ToolingFixtureFormValues>) => void
  isSubmitting: boolean
  initialValues?: ToolingFixture | ToolingFixtureFormValues
  status?: ToolingFixture['status']
}

const DEFAULT_VALUES: ToolingFixtureFormValues = {
  fixture_no: '',
  category: '',
  applicable_product_drawing_no: '',
  product_name: '',
  applicable_equipment: '',
  storage_location: '',
  manufactured_date: null,
  manufacturer: '',
  lifecycle: '正常',
  last_maintenance_date: null,
  maintenance_cycle_days: null,
  responsible_person: '',
  remarks: '',
}

function fieldLabel(
  name: (typeof TOOLING_FIXTURE_FORM_FIELDS)[number]['name'],
) {
  return TOOLING_FIXTURE_FORM_FIELDS.find((field) => field.name === name)?.label
}

function getFormValues(
  values?: ToolingFixture | ToolingFixtureFormValues,
): ToolingFixtureFormValues {
  if (!values) {
    return DEFAULT_VALUES
  }

  return {
    fixture_no: values.fixture_no,
    category: values.category,
    applicable_product_drawing_no: values.applicable_product_drawing_no,
    product_name: values.product_name,
    applicable_equipment: values.applicable_equipment,
    storage_location: values.storage_location,
    manufactured_date: values.manufactured_date,
    manufacturer: values.manufacturer,
    lifecycle: values.lifecycle,
    last_maintenance_date: values.last_maintenance_date,
    maintenance_cycle_days: values.maintenance_cycle_days,
    responsible_person: values.responsible_person,
    remarks: values.remarks,
  }
}

function dateFieldProps() {
  return {
    getValueProps: (value: string | null | undefined) => ({
      value: value ? dayjs(value) : null,
    }),
    getValueFromEvent: (value: Dayjs | null) =>
      value?.format('YYYY-MM-DD') ?? null,
  }
}

export default function ToolingFixtureForm({
  onFinish,
  setFormRef,
  isSubmitting,
  initialValues,
  status = '未使用',
}: ToolingFixtureFormProps) {
  const [form] = Form.useForm<ToolingFixtureFormValues>()

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  useEffect(() => {
    form.setFieldsValue(getFormValues(initialValues))
  }, [form, initialValues])

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={isSubmitting}
    >
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="fixture_no"
            label={fieldLabel('fixture_no')}
            rules={[{ required: true, message: '请输入工装模具编号' }]}
          >
            <Input maxLength={80} placeholder="请输入工装模具编号" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="category" label={fieldLabel('category')}>
            <Input maxLength={80} placeholder="如：检具、模具、夹具" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="applicable_product_drawing_no"
            label={fieldLabel('applicable_product_drawing_no')}
          >
            <Input maxLength={120} placeholder="请输入适用产品图号" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="product_name" label={fieldLabel('product_name')}>
            <Input maxLength={120} placeholder="请输入产品名称" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="applicable_equipment"
            label={fieldLabel('applicable_equipment')}
          >
            <Input maxLength={120} placeholder="请输入适用设备" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="storage_location"
            label={fieldLabel('storage_location')}
          >
            <Input maxLength={120} placeholder="请输入存放位置" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="manufactured_date"
            label={fieldLabel('manufactured_date')}
            {...dateFieldProps()}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="manufacturer" label={fieldLabel('manufacturer')}>
            <Input maxLength={120} placeholder="请输入制作厂商" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="lifecycle"
            label={fieldLabel('lifecycle')}
            rules={[{ required: true, message: '请选择寿命状态' }]}
          >
            <Select
              placeholder="请选择寿命状态"
              options={TOOLING_FIXTURE_LIFECYCLES.map((v) => ({
                label: v,
                value: v,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item label={fieldLabel('status')}>
            <Tag color={status === '使用中' ? 'orange' : 'green'}>{status}</Tag>
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="last_maintenance_date"
            label={fieldLabel('last_maintenance_date')}
            {...dateFieldProps()}
          >
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="maintenance_cycle_days"
            label={fieldLabel('maintenance_cycle_days')}
            rules={[{ type: 'number', min: 1, message: '请输入大于 0 的天数' }]}
          >
            <InputNumber
              className="w-full"
              min={1}
              precision={0}
              placeholder="请输入保养周期"
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="responsible_person"
            label={fieldLabel('responsible_person')}
          >
            <Input maxLength={80} placeholder="请输入责任人" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item name="remarks" label={fieldLabel('remarks')}>
            <Input.TextArea
              maxLength={500}
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="请输入备注"
            />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  )
}
