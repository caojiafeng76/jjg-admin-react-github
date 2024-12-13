import { Input } from 'antd'
import { useSearchParams } from 'react-router-dom'

export default function PartNoInput() {
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <Input
      placeholder="请输入件号"
      defaultValue={searchParams.get('PartNo') || ''}
      onChange={(e) => {
        searchParams.set('PartNo', e.target.value)
        searchParams.set('page', '1')
        searchParams.set('pageSize', '10')
        setSearchParams(searchParams)
      }}
    />
  )
}
