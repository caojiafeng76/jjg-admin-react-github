import { Input, Button, Space } from 'antd'
import { useState } from 'react'

interface Props {
  onSearch: (params: { operation?: string; model?: string }) => void
  onReset: () => void
  mobile?: boolean
}

export default function StandardTimeSearch({
  onSearch,
  onReset,
  mobile = false,
}: Props) {
  const [operation, setOperation] = useState('')
  const [model, setModel] = useState('')

  const handleSearch = () => {
    onSearch({
      operation: operation.trim() || undefined,
      model: model.trim() || undefined,
    })
  }

  const handleReset = () => {
    setOperation('')
    setModel('')
    onReset()
  }

  return (
    <div className={mobile ? 'grid grid-cols-1 gap-3' : 'flex flex-1 gap-2'}>
      <Space.Compact style={{ width: '100%', maxWidth: mobile ? undefined : 400 }}>
        <Input
          placeholder="请输入工序"
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
      </Space.Compact>
      <Space.Compact style={{ width: '100%', maxWidth: 400 }}>
        <Input
          placeholder="请输入型号"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />
      </Space.Compact>
      <Space className={mobile ? 'flex w-full [&_.ant-btn]:flex-1' : ''}>
        <Button type="primary" onClick={handleSearch}>
          搜索
        </Button>
        <Button onClick={handleReset}>重置</Button>
      </Space>
    </div>
  )
}
