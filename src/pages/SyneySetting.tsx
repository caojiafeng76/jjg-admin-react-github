import { useSerialNo } from '@/features/syney/PoList/useSerialNo'
import { useUpdateSerialNo } from '@/features/syney/PoList/useUpdateSerialNo'
import { Input, Typography, Spin } from 'antd'
import { useState } from 'react'

const { Text } = Typography

export default function SyneySetting() {
  const { serialNo, isLoading } = useSerialNo()
  const { updateSerialNo, isUpdating } = useUpdateSerialNo()

  const [input, setInput] = useState('')

  return (
    <div className="h-full w-full">
      <h1 className="mb-10 text-2xl font-semibold">西尼相关设置</h1>

      {isLoading && <Spin />}
      {!isLoading && (
        <>
          <Text className="">编号</Text>
          <Input
            className="ml-4 w-40"
            placeholder="请输入编号"
            defaultValue={serialNo?.SyneySerialNo || ''}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isUpdating}
            onBlur={() => {
              updateSerialNo(Number(input))
            }}
          />
        </>
      )}
    </div>
  )
}
