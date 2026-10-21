import { HomeIcon } from '@heroicons/react/16/solid'
import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import { getDefaultHomeByRole } from '@/config/access'
import { useAuth } from '@/contexts'
import { getRouteLabel } from '@/routes/routeLabels'

export interface PageForbiddenProps {
  /** 被拒绝访问的页面路径，用于展示页面名称 */
  pathname?: string
}

/**
 * 布局内的页面级无权限提示（403）。
 * 与 /access-denied（账号无档案/停用/无任何入口）区分：这里只代表「当前页面」无权限，
 * 菜单与其他标签页保持可用。
 */
export default function PageForbidden({ pathname }: PageForbiddenProps) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const pageLabel = pathname ? getRouteLabel(pathname) : undefined
  const homePath = getDefaultHomeByRole(role)

  return (
    <div className="flex h-full items-center justify-center">
      <Result
        status="403"
        title="暂无访问权限"
        subTitle={
          pageLabel
            ? `当前账号没有「${pageLabel}」页面的访问权限，如需使用请联系管理员开通。`
            : '当前账号没有此页面的访问权限，如需使用请联系管理员开通。'
        }
        extra={(
          <Button
            type="primary"
            icon={<HomeIcon className="size-4" />}
            onClick={() => navigate(homePath, { replace: true })}
          >
            返回首页
          </Button>
        )}
      />
    </div>
  )
}
