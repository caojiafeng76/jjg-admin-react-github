import { Select } from 'antd'
import { useSearchParams } from 'react-router-dom'

export default function PoSelectedFilter() {
  const [searchParams, setSearchParams] = useSearchParams()

  function filterStatus(value: string) {
    searchParams.set('Status', value)
    searchParams.set('page', '1')
    searchParams.set('pageSize', '10')
    setSearchParams(searchParams)
  }

  return (
    <Select
      className="w-32"
      onChange={filterStatus}
      defaultValue={searchParams.get('Status') || '全部'}
      options={[
        { value: '全部', label: <span>全部</span> },
        { value: '已创建', label: <span>已创建</span> },
        { value: '已入库', label: <span>已入库</span> },
        { value: '部分送货', label: <span>部分送货</span> },
        { value: '暂停', label: <span>暂停</span> },
        { value: '作废', label: <span>作废</span> },
      ]}
    />
  )
}
