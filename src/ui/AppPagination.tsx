import type { PaginationProps } from 'antd'
import { ConfigProvider, Pagination } from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/config/pagination'

const PAGINATION_LOCALE = {
  ...zhCN.Pagination,
  items_per_page: '条/页',
  page_size: '每页条数',
} satisfies NonNullable<PaginationProps['locale']>

interface Props {
  total: number
  pageSizeOptions?: string[]
  defaultPageSize?: number
}

export default function AppPagination({
  total,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  defaultPageSize = DEFAULT_PAGE_SIZE,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = Number(searchParams.get('page')) || 1
  const currentPageSize
    = Number(searchParams.get('pageSize')) || defaultPageSize
  const normalizedPageSizeOptions = pageSizeOptions.some(
    option => Number(option) === currentPageSize,
  )
    ? pageSizeOptions
    : [...pageSizeOptions, currentPageSize.toString()].sort(
        (left, right) => Number(left) - Number(right),
      )

  function onChange(page: number, pageSize: number) {
    // replace：翻页不产生浏览器历史记录，「后退」直接离开页面而不是逐页回退
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', page.toString())
      next.set('pageSize', pageSize.toString())
      return next
    }, { replace: true })
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
          current={currentPage}
          pageSize={currentPageSize}
          onChange={onChange}
          total={total}
          locale={PAGINATION_LOCALE}
          showSizeChanger={{
            getPopupContainer: () => document.body,
          }}
          pageSizeOptions={normalizedPageSizeOptions}
          showTotal={total => `共 ${total} 条`}
        />
      </ConfigProvider>
    </div>
  )
}
