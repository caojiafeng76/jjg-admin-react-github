import { Input } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useState } from 'react'

export default function PoSearchInput() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('SONo') || '')

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

  return (
    <Input.Search
      placeholder="搜索生产号"
      value={searchValue}
      onChange={handleChange}
      onSearch={handleSearch}
      allowClear
      className="w-52"
      enterButton="搜索"
    />
  )
}
