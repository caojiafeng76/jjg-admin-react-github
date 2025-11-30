import { Pagination } from 'antd'
import { useSearchParams } from 'react-router-dom'

interface Props {
  total: number
  pageSizeOptions?: string[]
  defaultPageSize?: number
}

export default function AppPagination({
  total,
  pageSizeOptions = ['10', '20', '50', '100'],
  defaultPageSize = 10,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams()

  function onChange(page: number, pageSize: number) {
    searchParams.set('page', page.toString())
    searchParams.set('pageSize', pageSize.toString())
    setSearchParams(searchParams)
  }

  return (
    <div className="mr-2 mt-4 flex justify-end">
      <Pagination
        defaultCurrent={1}
        defaultPageSize={defaultPageSize}
        current={Number(searchParams.get('page')) || 1}
        pageSize={Number(searchParams.get('pageSize')) || defaultPageSize}
        onChange={onChange}
        total={total}
        showSizeChanger
        pageSizeOptions={pageSizeOptions}
        showTotal={(total) => `共 ${total} 条`}
      />
    </div>
  )
}
