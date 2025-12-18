import React, { useState, useEffect, useMemo } from 'react'
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
      { key: 'syney-safe-part-setting', label: '安全件设置' },
      { key: 'syney-spec-list', label: '踏板规格列表' },
      { key: 'syney-setting', label: '编号设置' },
    ],
  },
  {
    key: 'workshop',
    label: '车间管理',
    icon: <Square3Stack3DIcon className="size-4" />,
    children: [
      { key: 'workshop-order-list', label: '订单管理' },
      { key: 'workshop-process-list', label: '工序管理' },
      { key: 'workshop-defect-reason-list', label: '不良原因管理' },
      { key: 'employee-list', label: '员工管理' },
      { key: 'production-record-list', label: '产量录入' },
      { key: 'production-statistics', label: '产量统计' },
    ],
  },
]

// 查找菜单项的父菜单 key
function findParentMenuKey(menuKey: string, menuItems: MenuItem[]): string | undefined {
  for (const item of menuItems) {
    if (item && 'children' in item && item.children) {
      // 检查子菜单中是否包含目标 key
      const hasChild = item.children.some((child: MenuItem) => child?.key === menuKey)
      if (hasChild && item.key) {
        return item.key as string
      }
    }
  }
  return undefined
}

const MainMenu: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // 从路径中提取当前选中的菜单项和应该展开的父菜单
  const { selectedKey, openKey } = useMemo(() => {
    const path = pathname.slice(1) || 'dashboard'
    const parentKey = findParentMenuKey(path, items)
    return {
      selectedKey: path,
      openKey: parentKey,
    }
  }, [pathname])

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    // 初始化时，如果有父菜单，则展开
    const path = pathname.slice(1) || 'dashboard'
    const parentKey = findParentMenuKey(path, items)
    return parentKey ? [parentKey] : []
  })

  // 当路径变化时，确保对应的父菜单保持展开
  useEffect(() => {
    if (openKey) {
      setOpenKeys((prevKeys) => {
        // 如果当前应该展开的父菜单不在 openKeys 中，则添加它
        if (!prevKeys.includes(openKey)) {
          return [...prevKeys, openKey]
        }
        return prevKeys
      })
    }
  }, [openKey])

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (!key) return
    navigate(`/${key}`)
  }

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    // 如果当前路径属于某个父菜单，确保该父菜单始终在 openKeys 中
    const newKeys = keys as string[]
    if (openKey && !newKeys.includes(openKey)) {
      // 如果用户尝试关闭当前应该展开的父菜单，阻止这个操作
      setOpenKeys([...newKeys, openKey])
    } else {
      setOpenKeys(newKeys)
    }
  }

  return (
    <Menu
      onClick={onClick}
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      theme="dark"
      mode="inline"
      items={items}
    />
  )
}

export default MainMenu
