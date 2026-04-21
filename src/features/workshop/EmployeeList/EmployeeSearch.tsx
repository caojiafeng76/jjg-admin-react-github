import { Button, Input, Select, Space } from 'antd'
import { useState } from 'react'
import { useRoleOptions } from '@/hooks/useRoleOptions'

interface Props {
  onSearch: (params: {
    name?: string
    role?: string
    is_active?: boolean
  }) => void
  onReset: () => void
}

export default function EmployeeSearch({ onSearch, onReset }: Props) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<string | undefined>()
  const [status, setStatus] = useState<'active' | 'inactive' | undefined>()
  const { options: roleOptions, isLoading: roleOptionsLoading } =
    useRoleOptions()

  const handleSearch = () => {
    onSearch({
      name: name.trim() || undefined,
      role,
      is_active:
        status === 'active' ? true : status === 'inactive' ? false : undefined,
    })
  }

  const handleReset = () => {
    setName('')
    setRole(undefined)
    setStatus(undefined)
    onReset()
  }

  return (
    <Space wrap size={8}>
      <Input
        placeholder="请输入姓名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={handleSearch}
        allowClear
        style={{ width: 220 }}
      />
      <Select
        placeholder="角色"
        value={role}
        onChange={(value) => setRole(value)}
        allowClear
        loading={roleOptionsLoading}
        style={{ width: 140 }}
        options={roleOptions}
      />
      <Select
        placeholder="状态"
        value={status}
        onChange={(value) => setStatus(value)}
        allowClear
        style={{ width: 140 }}
        options={[
          { label: '启用', value: 'active' },
          { label: '停用', value: 'inactive' },
        ]}
      />
      <Button type="primary" onClick={handleSearch}>
        搜索
      </Button>
      <Button onClick={handleReset}>重置</Button>
    </Space>
  )
}
