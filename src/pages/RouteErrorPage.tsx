import {
  ArrowLeftOutlined,
  HomeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from 'react-router-dom'

import AppErrorView from '@ui/AppErrorView'
import { getErrorDisplayInfo } from '@/utils/errorHandler'

interface RouteErrorContent {
  category: 'generic' | 'network' | 'permission' | 'notFound'
  variant: 'generic' | 'network' | 'permission' | 'notFound'
  title: string
  badge: string
  message: string
  detail?: string
  code?: string
}

function getRouteErrorContent(routeError: unknown): RouteErrorContent {
  if (isRouteErrorResponse(routeError)) {
    const routeData = routeError.data
    const errorMessage =
      typeof routeData === 'string'
        ? routeData
        : routeData &&
            typeof routeData === 'object' &&
            'message' in routeData &&
            typeof routeData.message === 'string'
          ? routeData.message
          : routeError.statusText || `请求失败（${routeError.status}）`

    const info = getErrorDisplayInfo(
      new Error(errorMessage),
      routeError.status === 404
        ? '你访问的页面不存在，请检查地址或从导航重新进入。'
        : '页面暂时无法打开，请稍后重试。',
    )

    return {
      variant: routeError.status === 404 ? 'notFound' : info.category,
      title: routeError.status === 404 ? '页面不存在' : '页面暂时无法打开',
      badge:
        routeError.status === 404 ? '404 页面' : `错误 ${routeError.status}`,
      ...info,
    }
  }

  const info = getErrorDisplayInfo(routeError, '页面暂时无法打开，请稍后重试。')

  return {
    ...info,
    variant: info.category,
    title: getRouteTitle(info.category),
    badge: getRouteBadge(info.category),
  }
}

function getRouteTitle(
  category: 'generic' | 'network' | 'permission' | 'notFound',
) {
  if (category === 'network') {
    return '网络连接暂时不可用'
  }

  if (category === 'permission') {
    return '当前账号暂无访问权限'
  }

  if (category === 'notFound') {
    return '你访问的页面不存在'
  }

  return '页面暂时无法打开'
}

function getRouteBadge(
  category: 'generic' | 'network' | 'permission' | 'notFound',
) {
  if (category === 'network') {
    return '网络异常'
  }

  if (category === 'permission') {
    return '权限限制'
  }

  if (category === 'notFound') {
    return '404 页面'
  }

  return '运行异常'
}

export default function RouteErrorPage() {
  const navigate = useNavigate()
  const routeError = useRouteError()
  const errorContent = getRouteErrorContent(routeError)

  return (
    <AppErrorView
      variant={errorContent.variant || errorContent.category}
      title={errorContent.title || getRouteTitle(errorContent.category)}
      badge={errorContent.badge || getRouteBadge(errorContent.category)}
      description={errorContent.message}
      detail={errorContent.detail}
      code={errorContent.code}
      actions={[
        {
          key: 'reload',
          label: '重新加载',
          type: 'primary',
          icon: <ReloadOutlined />,
          onClick: () => window.location.reload(),
        },
        {
          key: 'home',
          label: '返回首页',
          icon: <HomeOutlined />,
          onClick: () => navigate('/', { replace: true }),
        },
        {
          key: 'back',
          label: '返回上一页',
          icon: <ArrowLeftOutlined />,
          onClick: () => navigate(-1),
        },
      ]}
    />
  )
}
