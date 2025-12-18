import { useState } from 'react'
import { Button, Form, Input, Switch, Table, Popconfirm, Space, App, Select } from 'antd'
import type { ColumnsType, FilterDropdownProps } from 'antd/es/table/interface'
import { SearchOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteSyneySafePartSettings,
  getSyneySafePartSettings,
  upsertSyneySafePartSetting,
  SyneySafePartSetting,
} from '@services/apiSyneySafePartSettings'

export default function SafePartSettingPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<SyneySafePartSetting | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['syney-safe-part-settings'],
    queryFn: getSyneySafePartSettings,
  })

  const saveMutation = useMutation({
    mutationFn: upsertSyneySafePartSetting,
    onSuccess: () => {
      message.success('保存成功')
      queryClient.invalidateQueries({ queryKey: ['syney-safe-part-settings'] })
      setEditing(null)
      form.resetFields()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSyneySafePartSettings,
    onSuccess: () => {
      message.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['syney-safe-part-settings'] })
    },
  })

  const columns: ColumnsType<SyneySafePartSetting> = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 60,
      render: (_: unknown, __: SyneySafePartSetting, index: number) => index + 1,
    },
    {
      title: '件号(包含)',
      dataIndex: 'part_no',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: FilterDropdownProps) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            placeholder="搜索件号"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              size="small"
              onClick={() => confirm()}
            >
              确定
            </Button>
            <Button
              size="small"
              onClick={() => {
                clearFilters?.()
                confirm({ closeDropdown: false })
              }}
            >
              重置
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
      ),
      onFilter: (value, record) =>
        (record.part_no ?? '').toLowerCase().includes(String(value).toLowerCase()),
    },
    { title: '名称', dataIndex: 'name' },
    {
      title: '是否需打印标签',
      dataIndex: 'need_print_label',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    {
      title: '是否为安全部件',
      dataIndex: 'is_safe_part',
      render: (v: boolean) => (v ? '是' : '否'),
    },
    { title: '备注', dataIndex: 'remark' },
    {
      title: '操作',
      render: (_: unknown, record: SyneySafePartSetting) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditing(record)
              form.setFieldsValue({
                part_no: record.part_no,
                name: record.name ?? undefined,
                need_print_label: record.need_print_label,
                is_safe_part: record.is_safe_part,
                remark: record.remark ?? '',
                id: record.id,
              })
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除?"
            onConfirm={() => deleteMutation.mutate([record.id])}
          >
            <Button type="link" danger loading={deleteMutation.isPending}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleSubmit = (values: any) => {
    saveMutation.mutate(values)
  }

  return (
    <div className="p-4 space-y-4">
      <Form
        layout="inline"
        form={form}
        onFinish={handleSubmit}
        initialValues={{ need_print_label: true, is_safe_part: true }}
      >
        <Form.Item
          label="件号(包含)"
          name="part_no"
          rules={[{ required: true, message: '请输入件号' }]}
        >
          <Input allowClear placeholder="如 XN2808EB" className="w-48" />
        </Form.Item>
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请选择名称' }]}
        >
          <Select
            style={{ width: 200 }}
            dropdownMatchSelectWidth={220}
            options={[
              { label: '梳齿支撑板', value: '梳齿支撑板' },
              { label: '楼层板', value: '楼层板' },
            ]}
          />
        </Form.Item>
        <Form.Item label="需打印标签" name="need_print_label" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="为安全部件" name="is_safe_part" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Input allowClear className="w-60" />
        </Form.Item>
        <Form.Item name="id" hidden>
          <Input />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={saveMutation.isPending}
          >
            {editing ? '保存修改' : '新增'}
          </Button>
        </Form.Item>
        {editing && (
          <Form.Item>
            <Button
              onClick={() => {
                setEditing(null)
                form.resetFields()
              }}
            >
              取消编辑
            </Button>
          </Form.Item>
        )}
      </Form>

      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={columns}
        size="small"
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          onShowSizeChange: (_current, size) => setPageSize(size),
        }}
      />
    </div>
  )
}
