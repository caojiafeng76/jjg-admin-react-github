import { Input } from 'antd'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function PartNoInput() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get('PartNo') || '')

  useEffect(() => {
    setValue(searchParams.get('PartNo') || '')
  }, [searchParams])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setValue(next)
    if (next) {
      searchParams.set('PartNo', next)
    } else {
      searchParams.delete('PartNo')
    }
    searchParams.set('page', '1')
    searchParams.set('pageSize', '10')
    setSearchParams(searchParams)
  }

  return (
    <Input
      placeholder="请输入件号"
      value={value}
      onChange={handleChange}
      allowClear={{
        clearIcon: <XMarkIcon className="h-3.5 w-3.5 text-slate-400" />,
      }}
      prefix={
        <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400" />
      }
      className="w-56 rounded-lg"
    />
  )
}
