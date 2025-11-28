import { useSerialNo } from '@/features/syney/PoList/useSerialNo'
import { useUpdateSerialNo } from '@/features/syney/PoList/useUpdateSerialNo'
import { Input, Typography, Spin } from 'antd'
import { useState, useEffect } from 'react'

const { Text } = Typography

export default function SyneySetting() {
  const { serialNo, isLoading } = useSerialNo()
  const { updateSerialNo, isUpdating } = useUpdateSerialNo()

  const [input, setInput] = useState('')

  // 当 serialNo 更新时，同步更新 input 状态
  useEffect(() => {
    if (serialNo?.SyneySerialNo !== undefined) {
      setInput(String(serialNo.SyneySerialNo))
    }
  }, [serialNo?.SyneySerialNo])

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
            value={input}
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
