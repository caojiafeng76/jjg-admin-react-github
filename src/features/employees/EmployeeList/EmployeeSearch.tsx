import { Input, Button, Space } from 'antd'
import { useState } from 'react'

interface Props {
  onSearch: (params: { name?: string }) => void
  onReset: () => void
}

export default function EmployeeSearch({ onSearch, onReset }: Props) {
  const [name, setName] = useState('')

  const handleSearch = () => {
    onSearch({
      name: name.trim() || undefined,
    })
  }

  const handleReset = () => {
    setName('')
    onReset()
  }

  return (
    <Space.Compact style={{ width: '100%', maxWidth: 400 }}>
      <Input
        placeholder="请输入姓名"
        value={name}
        onChange={(e) => setName(e.target.value)}
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


