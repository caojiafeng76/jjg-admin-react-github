import { Input } from 'antd'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function PoSearchInput() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('SONo') || '')

  useEffect(() => {
    setSearchValue(searchParams.get('SONo') || '')
  }, [searchParams])

  const handleSearch = (value: string) => {
    const trimmedValue = value.trim()
    setSearchValue(trimmedValue)

    if (trimmedValue) {
      searchParams.set('SONo', trimmedValue)
    } else {
      searchParams.delete('SONo')
    }
    searchParams.set('page', '1')
    setSearchParams(searchParams)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  const handleClear = () => {
    setSearchValue('')
    searchParams.delete('SONo')
    searchParams.set('page', '1')
    setSearchParams(searchParams)
  }

  return (
    <Input
      placeholder="搜索生产号"
      value={searchValue}
      onChange={handleChange}
      onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
      onClear={handleClear}
      allowClear={{ clearIcon: <XMarkIcon className="h-3.5 w-3.5 text-slate-400" /> }}
      prefix={
        <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400" />
      }
      className="w-56 rounded-lg"
    />
  )
}
