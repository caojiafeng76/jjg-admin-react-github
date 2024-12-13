import { Select } from 'antd'
import { useSearchParams } from 'react-router-dom'

const options = [
  { value: 'all', label: '全部' },
  { value: 'unconfirmed', label: '未校对' },
  { value: 'confirmed', label: '已校对' },
]
export default function ReportSelect() {
  const [searchParams, setSearchParams] = useSearchParams()

  return (
    <Select
      className="w-32"
      options={options}
      defaultValue={'all'}
      onChange={(value) => {
        searchParams.set('status', value)
        setSearchParams(searchParams)
      }}
    />
  )
}
