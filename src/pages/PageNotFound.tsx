import { ArrowLeftIcon, HomeIcon } from '@heroicons/react/16/solid'
import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

/** 布局内 404：只替换内容区，菜单与其他标签页保持可用 */
export default function PageNotFound() {
  const navigate = useNavigate()

  return (
    <div className="flex h-full items-center justify-center">
      <Result
        status="404"
        title="页面不存在"
        subTitle="链接可能已失效或地址有误，请从左侧菜单重新进入对应模块。"
        extra={(
          <div className="flex justify-center gap-2">
            <Button
              type="primary"
              icon={<HomeIcon className="size-4" />}
              onClick={() => navigate('/', { replace: true })}
            >
              返回首页
            </Button>
            <Button
              icon={<ArrowLeftIcon className="size-4" />}
              onClick={() => navigate(-1)}
            >
              返回上一页
            </Button>
          </div>
        )}
      />
    </div>
  )
}
