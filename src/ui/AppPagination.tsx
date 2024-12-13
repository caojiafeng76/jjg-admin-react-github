import { Pagination } from 'antd'
import { useSearchParams } from 'react-router-dom'

export default function AppPagination({ total }: { total: number }) {
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
        defaultPageSize={10}
        current={Number(searchParams.get('page')) || 1}
        pageSize={Number(searchParams.get('pageSize')) || 10}
        onChange={onChange}
        total={total}
        showSizeChanger
        pageSizeOptions={['10', '20', '50', '100']}
        showTotal={(total) => `共 ${total} 条`}
      />
    </div>
  )
}
