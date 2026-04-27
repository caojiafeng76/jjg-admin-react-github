import { LinkOutlined } from '@ant-design/icons'
import { Button, Popover, Space, Tag, Typography } from 'antd'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import AppQRCode from '@ui/AppQRCode'
import type { WorkshopOrder } from './index'
import {
  getWorkshopOrderQrPath,
  getWorkshopOrderQrValue,
} from './workshopOrderQr'

const qrWrapperStyle = {
  height: 24,
  width: 24,
}

const qrPreviewStyle = {
  height: 160,
  width: 160,
}

interface WorkshopOrderQrCellProps {
  order: WorkshopOrder
}

export default function WorkshopOrderQrCell({
  order,
}: WorkshopOrderQrCellProps) {
  const navigate = useNavigate()
  const orderId = order.id || ''
  const qrPath = useMemo(() => getWorkshopOrderQrPath(orderId), [orderId])
  const qrValue = useMemo(() => getWorkshopOrderQrValue(orderId), [orderId])

  if (!orderId) {
    return <Tag bordered={false}>无</Tag>
  }

  return (
    <Popover
      trigger="hover"
      placement="right"
      content={
        <Space direction="vertical" size={12} className="items-center">
          <div
            className="rounded-lg bg-white p-2 shadow-sm"
            style={qrPreviewStyle}
          >
            <AppQRCode
              value={qrValue}
              size={144}
              style={{ height: '100%', width: '100%' }}
            />
          </div>
          <Typography.Text className="max-w-40 text-center text-xs text-slate-500">
            扫码查看项目号 {order.project_no?.trim() || '未填写'} 的订单详情
          </Typography.Text>
          <Button
            type="link"
            size="small"
            icon={<LinkOutlined />}
            onClick={() => navigate(qrPath)}
          >
            打开详情
          </Button>
        </Space>
      }
    >
      <div className="inline-flex rounded border border-slate-200 bg-white p-0.5 shadow-sm">
        <div style={qrWrapperStyle}>
          <AppQRCode
            value={qrValue}
            size={24}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </div>
    </Popover>
  )
}
