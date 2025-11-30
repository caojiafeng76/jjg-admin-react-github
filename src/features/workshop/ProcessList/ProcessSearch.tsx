import { Input, Button, Space } from 'antd'
import { useState } from 'react'

interface Props {
  onSearch: (params: { process_name?: string }) => void
  onReset: () => void
}

export default function ProcessSearch({ onSearch, onReset }: Props) {
  const [processName, setProcessName] = useState('')

  const handleSearch = () => {
    onSearch({
      process_name: processName.trim() || undefined,
    })
  }

  const handleReset = () => {
    setProcessName('')
    onReset()
  }

  return (
    <Space.Compact style={{ width: '100%', maxWidth: 400 }}>
      <Input
        placeholder="请输入工序名称"
        value={processName}
        onChange={(e) => setProcessName(e.target.value)}
        onPressEnter={handleSearch}
        allowClear
      />
      <Button type="primary" onClick={handleSearch}>
        搜索
      </Button>
      <Button onClick={handleReset}>重置</Button>
    </Space.Compact>
  )
}



