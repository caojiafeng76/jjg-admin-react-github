import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

import AppErrorView from '@ui/AppErrorView'

export default function PageNotFound() {
  const navigate = useNavigate()

  return (
    <AppErrorView
      variant="notFound"
      title="你访问的页面不存在"
      badge="404 页面"
      description="链接可能已经失效，或者当前账号没有这个前端入口。你可以从系统导航重新进入对应模块。"
      detail="如果这是收藏夹或外部分享链接，请确认路径是否仍然有效。"
      actions={[
        {
          key: 'home',
          label: '返回首页',
          type: 'primary',
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
