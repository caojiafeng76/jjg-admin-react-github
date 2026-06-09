import { Card, Typography, Space, theme } from 'antd'

const { Title, Text } = Typography

export default function Dashboard() {
  const {
    token: { colorPrimary, colorTextDescription, colorTextSecondary },
  } = theme.useToken()

  return (
    <div className="flex h-full items-center justify-center p-8">
      <Card className="w-full max-w-2xl text-center">
        <Space direction="vertical" size="large" className="w-full">
          <Title
            level={1}
            className="text-3xl font-bold"
            style={{ color: colorPrimary }}
          >
            欢迎使用
          </Title>
          <Text className="text-lg" style={{ color: colorTextSecondary }}>
            精加工车间管理系统
          </Text>
          <div className="mt-8 text-sm" style={{ color: colorTextDescription }}>
            <Text style={{ color: 'inherit' }}>请从左侧菜单选择功能模块</Text>
          </div>
        </Space>
      </Card>
    </div>
  )
}
