import { DatePicker, Form, FormInstance, Input, InputNumber, Radio, Table, Alert, Typography } from 'antd'
import type { TableColumnsType } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import type { WorkshopOrder } from './index'
import WorkshopExcelUpload from './WorkshopExcelUpload'

const { Text } = Typography

interface Props {
  onFinish: (values: WorkshopOrder | WorkshopOrder[]) => void
  setFormRef: (form: FormInstance<WorkshopOrder>) => void
  isCreating: boolean
  isEdit: boolean
  initialValues?: WorkshopOrder
}

export default function WorkshopOrderForm({
  onFinish,
  setFormRef,
  isCreating,
  isEdit,
  initialValues,
}: Props) {
  const [form] = Form.useForm<WorkshopOrder>()
  const [importMode, setImportMode] = useState<'manual' | 'excel'>('manual')
  const [excelRows, setExcelRows] = useState<WorkshopOrder[]>([])

  useEffect(() => {
    setFormRef(form)
  }, [form, setFormRef])

  const handleFinish = (values: WorkshopOrder) => {
    if (importMode === 'excel' && excelRows.length > 0) {
      // Excel 导入模式：批量提交
      const formattedRows = excelRows.map((row) => ({
        ...row,
        product_delivery_date: row.product_delivery_date || null,
      }))
      onFinish(formattedRows)
    } else {
      // 手动输入模式：单条提交
      const payload: WorkshopOrder = {
        ...values,
        product_delivery_date: values.product_delivery_date
          ? dayjs(values.product_delivery_date).format('YYYY-MM-DD')
          : null,
      }
      onFinish(payload)
    }
  }

  const handleExcelParsed = (rows: WorkshopOrder[]) => {
    setExcelRows(rows)
  }

  const getTableColumns = (): TableColumnsType<WorkshopOrder> => {
    return [
      {
        title: '#',
        render: (_text, _record, index) => index + 1,
        width: 50,
      },
      {
        title: '产品交货日期',
        dataIndex: 'product_delivery_date',
        width: 120,
      },
      {
        title: '项目号',
        dataIndex: 'project_no',
        width: 120,
      },
      {
        title: '产品型号',
        dataIndex: 'product_model',
        width: 120,
      },
      {
        title: '长度(mm)',
        dataIndex: 'length_mm',
        width: 100,
      },
      {
        title: '客户型号',
        dataIndex: 'customer_model',
        width: 200,
        ellipsis: true,
      },
      {
        title: '订支数',
        dataIndex: 'order_quantity',
        width: 80,
      },
      {
        title: '每米理论重(kg/m)',
        dataIndex: 'weight_per_meter_kg',
        width: 120,
      },
      {
        title: '颜色名称',
        dataIndex: 'color_name',
        width: 100,
      },
      {
        title: '包装名称',
        dataIndex: 'package_name',
        width: 120,
      },
      {
        title: '产品类别',
        dataIndex: 'product_category',
        width: 120,
      },
      {
        title: '材质名称',
        dataIndex: 'material_name',
        width: 120,
      },
      {
        title: '料号',
        dataIndex: 'material_code',
        width: 120,
      },
    ]
  }

  return (
    <Form<WorkshopOrder>
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={initialValues}
    >
      {/* 导入方式选择 (仅在新建时显示) */}
      {!isEdit && (
        <Form.Item label="导入方式">
          <Radio.Group
            value={importMode}
            onChange={(e) => {
              setImportMode(e.target.value)
              setExcelRows([])
              form.resetFields()
            }}
            disabled={isCreating}
          >
            <Radio value="manual">手动输入</Radio>
            <Radio value="excel">Excel导入</Radio>
          </Radio.Group>
        </Form.Item>
      )}

      {/* 手动输入模式或编辑模式 */}
      {(importMode === 'manual' || isEdit) && (
        <>
          <Form.Item
            name="product_delivery_date"
            label="产品交货日期"
          >
            <DatePicker style={{ width: '100%' }} disabled={isCreating} />
          </Form.Item>

          <Form.Item
            name="project_no"
            label="项目号"
            rules={[{ required: true, message: '请输入项目号' }]}
          >
            <Input disabled={isCreating} />
          </Form.Item>

          <Form.Item
            name="product_model"
            label="产品型号"
            rules={[{ required: true, message: '请输入产品型号' }]}
          >
            <Input disabled={isCreating} />
          </Form.Item>

          <Form.Item
            name="length_mm"
            label="长度(mm)"
            rules={[{ required: true, message: '请输入长度' }]}
          >
            <InputNumber style={{ width: '100%' }} disabled={isCreating} />
          </Form.Item>

          <Form.Item
            name="customer_model"
            label="客户型号"
          >
            <Input disabled={isCreating} />
          </Form.Item>

          <Form.Item
            name="order_quantity"
            label="订支数"
            rules={[{ required: true, message: '请输入订支数' }]}
          >
            <InputNumber style={{ width: '100%' }} disabled={isCreating} />
          </Form.Item>

          <Form.Item
            name="weight_per_meter_kg"
            label="每米理论重(kg/m)"
            rules={[{ required: true, message: '请输入每米理论重' }]}
          >
            <InputNumber style={{ width: '100%' }} disabled={isCreating} />
          </Form.Item>

          <Form.Item name="color_name" label="颜色名称">
            <Input disabled={isCreating} />
          </Form.Item>

          <Form.Item name="package_name" label="包装名称">
            <Input disabled={isCreating} />
          </Form.Item>

          <Form.Item name="product_category" label="产品类别">
            <Input disabled={isCreating} />
          </Form.Item>

          <Form.Item name="material_name" label="材质名称">
            <Input disabled={isCreating} />
          </Form.Item>

          <Form.Item name="material_code" label="料号">
            <Input disabled={isCreating} />
          </Form.Item>
        </>
      )}

      {/* Excel导入模式 */}
      {!isEdit && importMode === 'excel' && (
        <>
          <Form.Item label="上传文件">
            <WorkshopExcelUpload
              onParsed={handleExcelParsed}
              disabled={isCreating}
            />
          </Form.Item>
          {excelRows.length > 0 && (
            <Form.Item label="解析结果">
              <Alert
                message="Excel文件解析成功"
                description={
                  <div>
                    <Text strong>已解析 {excelRows.length} 条数据，点击确定将批量导入</Text>
                  </div>
                }
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Table
                columns={getTableColumns()}
                dataSource={excelRows.map((row, index) => ({
                  ...row,
                  key: index,
                }))}
                size="small"
                pagination={false}
                scroll={{ x: 1400, y: 300 }}
                bordered
              />
            </Form.Item>
          )}
        </>
      )}
    </Form>
  )
}
