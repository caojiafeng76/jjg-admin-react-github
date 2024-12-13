import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'
import { HomeIcon, Square3Stack3DIcon } from '@heroicons/react/16/solid'

type MenuItem = Required<MenuProps>['items'][number]

const items: MenuItem[] = [
  {
    key: 'dashboard',
    label: '首页',
    icon: <HomeIcon className="size-4" />,
  },
  {
    key: 'syney',
    label: '西尼',
    icon: <Square3Stack3DIcon className="size-4" />,
    children: [
      { key: 'syney-po-list', label: '订单列表' },
      { key: 'syney-store-report-list', label: '入库单列表' },
      { key: 'syney-spec-list', label: '踏板规格列表' },
      { key: 'syney-setting', label: '设置' },
    ],
  },
]

const MainMenu: React.FC = () => {
  const navigate = useNavigate()

  const { pathname } = useLocation()

  const [activePath, setActivePath] = useState(getInitialPath)
  const openKeys = activePath.split('-').at(0)
  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (!key) return

    setActivePath(key)

    navigate(key)
  }

  function getInitialPath() {
    return pathname.slice(1) || 'dashboard'
  }

  return (
    <Menu
      onClick={onClick}
      defaultSelectedKeys={[activePath as string]}
      defaultOpenKeys={[openKeys as string]}
      theme="dark"
      mode="inline"
      items={items}
    />
  )
}

export default MainMenu
