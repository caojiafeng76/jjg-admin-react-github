import { Pagination, ConfigProvider } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
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
    <div className="flex justify-end">
      <ConfigProvider
        locale={zhCN}
        getPopupContainer={(_triggerNode) => {
          // 将下拉菜单渲染到 body，避免被父容器的 overflow-hidden 裁剪
          return document.body
        }}
      >
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
      </ConfigProvider>
    </div>
  )
}
