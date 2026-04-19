import { Card, Space, Typography } from 'antd'
import { useLocation } from 'react-router-dom'

const { Title, Paragraph, Text } = Typography

const pageLabelMap: Record<string, string> = {
  'production-scheduling': '排产计划',
  'precision-cutting-transfer': '转移单',
  'tooling-data': '刀具资料',
  'tooling-inventory': '刀具库存',
  'tooling-stock-in': '刀具入库',
  'tooling-stock-out': '刀具出库',
  'youmai-product-data': '货品资料',
  'youmai-finished-goods-inventory': '成品库存',
  'youmai-finished-goods-stock-in': '成品入库',
  'youmai-finished-goods-stock-out': '成品出库',
  'attendance-detail': '考勤明细',
  'attendance-summary': '考勤统计',
}

export default function ComingSoonPage() {
  const { pathname } = useLocation()
  const currentPath = pathname.slice(1)
  const pageTitle = pageLabelMap[currentPath] || '此功能'

  return (
    <div className="flex min-h-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-3xl border-0 shadow-sm">
        <Space direction="vertical" size={20} className="w-full text-center">
          <Text className="text-xs font-medium tracking-[0.35em] text-gray-400 uppercase">
            Coming Soon
          </Text>
          <Title level={2} className="mb-0!">
            {pageTitle}
          </Title>
          <Paragraph className="mb-0! text-base text-gray-500">
            此功能开发中
          </Paragraph>
        </Space>
      </Card>
    </div>
  )
}
