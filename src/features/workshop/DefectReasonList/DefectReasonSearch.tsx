import { Input, Button, Space } from 'antd'
import { useState } from 'react'

interface Props {
  onSearch: (params: { defect_reason?: string }) => void
  onReset: () => void
}

export default function DefectReasonSearch({ onSearch, onReset }: Props) {
  const [defectReason, setDefectReason] = useState('')

  const handleSearch = () => {
    onSearch({
      defect_reason: defectReason.trim() || undefined,
    })
  }

  const handleReset = () => {
    setDefectReason('')
    onReset()
  }

  return (
    <Space.Compact style={{ width: '100%', maxWidth: 400 }}>
      <Input
        placeholder="请输入不良原因"
        value={defectReason}
        onChange={(e) => setDefectReason(e.target.value)}
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


