import { ArrowLeftOutlined, QrcodeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Result,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { queryConfig } from '@/config/queryClient'
import AppQRCode from '@ui/AppQRCode'
import { getWorkshopOrderById } from '@/services/apiWorkshopOrders'
import {
  getWorkshopOrderStatusColor,
  normalizeWorkshopOrderStatus,
} from '@/features/workshop/OrderList/orderStatus'
import { getWorkshopOrderQrValue } from '@/features/workshop/OrderList/workshopOrderQr'

const { Paragraph, Text, Title } = Typography

function formatText(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '未填写'
  }

  return String(value)
}

export default function WorkshopOrderQrDetail() {
  const navigate = useNavigate()
  const { orderId = '' } = useParams()
  const qrValue = useMemo(() => getWorkshopOrderQrValue(orderId), [orderId])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['workshop-order', orderId],
    queryFn: () => getWorkshopOrderById(orderId),
    enabled: Boolean(orderId),
    ...queryConfig.detail,
  })

  if (!orderId) {
    return (
      <Result
        status="warning"
        title="二维码链接无效"
        subTitle="未识别到订单编号，请重新扫描有效二维码。"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" tip="订单信息加载中" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Result
        status="error"
        title="订单信息获取失败"
        subTitle={error instanceof Error ? error.message : '请稍后重试'}
        extra={
          <Button type="primary" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
        }
      />
    )
  }

  const status = normalizeWorkshopOrderStatus(data.status)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
      <Space align="center" className="justify-between">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <Tag color={getWorkshopOrderStatusColor(status)}>{status}</Tag>
      </Space>

      <Card className="shadow-sm">
        <Space direction="vertical" size={12} className="w-full">
          <Space align="start" className="w-full justify-between gap-4">
            <div>
              <Title level={3} style={{ marginBottom: 8 }}>
                订单扫码详情
              </Title>
              <Paragraph className="mb-0 text-slate-500">
                扫码后展示该订单的核心信息，适合在手机端快速查看。
              </Paragraph>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="h-28 w-28">
                <AppQRCode
                  value={qrValue}
                  size={112}
                  style={{ height: '100%', width: '100%' }}
                />
              </div>
            </div>
          </Space>

          <Alert
            type="info"
            showIcon
            icon={<QrcodeOutlined />}
            message={`项目号：${formatText(data.project_no)}`}
            description="当前页面为订单只读信息页，不提供编辑操作。"
          />

          <Descriptions
            bordered
            column={1}
            size="middle"
            labelStyle={{ width: 120 }}
            items={[
              {
                key: 'project_no',
                label: '项目号',
                children: formatText(data.project_no),
              },
              {
                key: 'product_delivery_date',
                label: '交货日期',
                children: formatText(data.product_delivery_date),
              },
              {
                key: 'customer',
                label: '客户',
                children: formatText(data.customer),
              },
              {
                key: 'product_model',
                label: '产品型号',
                children: formatText(data.product_model),
              },
              {
                key: 'customer_model',
                label: '客户型号',
                children: formatText(data.customer_model),
              },
              {
                key: 'length_mm',
                label: '长度(mm)',
                children: formatText(data.length_mm),
              },
              {
                key: 'order_quantity',
                label: '支数',
                children: formatText(data.order_quantity),
              },
              {
                key: 'product_category',
                label: '表面处理',
                children: formatText(data.product_category),
              },
              {
                key: 'color_name',
                label: '颜色',
                children: formatText(data.color_name),
              },
              {
                key: 'package_name',
                label: '包装方式',
                children: formatText(data.package_name),
              },
              {
                key: 'material_name',
                label: '材质',
                children: formatText(data.material_name),
              },
              {
                key: 'material_code',
                label: '料号',
                children: formatText(data.material_code),
              },
              {
                key: 'status',
                label: '状态',
                children: (
                  <Tag color={getWorkshopOrderStatusColor(status)}>
                    {status}
                  </Tag>
                ),
              },
            ]}
          />

          <Text type="secondary">如需编辑订单，请使用桌面端订单管理页面。</Text>
        </Space>
      </Card>
    </div>
  )
}
