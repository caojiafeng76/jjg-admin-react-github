import { useEffect } from 'react'
import { Button, DatePicker, Form, Input, Select, Space } from 'antd'
import type { Dayjs } from 'dayjs'

import {
  QUALITY_ISSUE_AUDIT_STATUS_LABELS,
  QUALITY_ISSUE_AUDIT_STATUSES,
  type QualityIssueAuditStatus,
  type QualityIssueRecordSearchParams,
} from '@/services/apiQualityIssueRecords'

const { RangePicker } = DatePicker

const AUDIT_STATUS_LABELS = QUALITY_ISSUE_AUDIT_STATUS_LABELS

interface SearchValues {
  auditStatus?: QualityIssueAuditStatus
  dateRange?: [Dayjs, Dayjs]
  keyword?: string
  operatorEmployeeId?: string
  projectNo?: string
  reporterEmployeeId?: string
}

interface Props {
  employees: Array<{ id: string; name: string }>
  initialValues?: QualityIssueRecordSearchParams
  onReset: () => void
  onSearch: (params: QualityIssueRecordSearchParams) => void
}

export default function IssueRecordSearch({
  employees,
  initialValues,
  onReset,
  onSearch,
}: Props) {
  const [form] = Form.useForm<SearchValues>()

  useEffect(() => {
    form.setFieldsValue({
      auditStatus: initialValues?.auditStatus,
      keyword: initialValues?.keyword,
      operatorEmployeeId: initialValues?.operatorEmployeeId,
      projectNo: initialValues?.projectNo,
      reporterEmployeeId: initialValues?.reporterEmployeeId,
    })
  }, [form, initialValues])

  const handleSearch = (values: SearchValues) => {
    onSearch({
      auditStatus: values.auditStatus,
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
      keyword: values.keyword?.trim() || undefined,
      operatorEmployeeId: values.operatorEmployeeId,
      projectNo: values.projectNo?.trim() || undefined,
      reporterEmployeeId: values.reporterEmployeeId,
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
    })
  }

  const handleReset = () => {
    form.resetFields()
    onReset()
  }

  return (
    <Form
      form={form}
      onFinish={handleSearch}
      className="flex flex-1 flex-wrap gap-2"
    >
      <Form.Item name="dateRange" className="mb-0">
        <RangePicker format="YYYY-MM-DD" />
      </Form.Item>

      <Form.Item name="reporterEmployeeId" className="mb-0">
        <Select
          allowClear
          showSearch
          placeholder="上报人"
          optionFilterProp="label"
          style={{ width: 160 }}
          options={employees.map((employee) => ({
            label: employee.name,
            value: employee.id,
          }))}
        />
      </Form.Item>

      <Form.Item name="operatorEmployeeId" className="mb-0">
        <Select
          allowClear
          showSearch
          placeholder="操作人"
          optionFilterProp="label"
          style={{ width: 160 }}
          options={employees.map((employee) => ({
            label: employee.name,
            value: employee.id,
          }))}
        />
      </Form.Item>

      <Form.Item name="auditStatus" className="mb-0">
        <Select
          allowClear
          placeholder="审核状态"
          style={{ width: 140 }}
          options={QUALITY_ISSUE_AUDIT_STATUSES.map((status) => ({
            label: AUDIT_STATUS_LABELS[status],
            value: status,
          }))}
        />
      </Form.Item>

      <Form.Item name="projectNo" className="mb-0">
        <Input
          allowClear
          placeholder="项目号"
          style={{ width: 180 }}
          onPressEnter={() => form.submit()}
        />
      </Form.Item>

      <Form.Item name="keyword" className="mb-0" style={{ width: 320 }}>
        <Input
          allowClear
          placeholder="质量问题、原因、客户、型号、人员或备注"
          onPressEnter={() => form.submit()}
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space>
          <Button type="primary" htmlType="submit">
            搜索
          </Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  )
}

export { AUDIT_STATUS_LABELS }
