import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { MenuProps } from 'antd'
import { Menu } from 'antd'

import { usePermissionContext } from '@/contexts'
import { useAuth } from '@/contexts'
import { isViewerRole } from '@/config/access'
import { useAppStore } from '@/store'
import {
  allMenuItems,
  filterMenuByPermissions,
  findAncestorMenuKeys,
} from './mainMenuItems'

// ----------------------------------------------------------------
// MainMenu 组件
// ----------------------------------------------------------------
const MainMenu: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { can, isLoading } = usePermissionContext()
  const { role } = useAuth()
  const isViewer = isViewerRole(role)
  const isDarkMode = useAppStore((state) => state.isDarkMode)

  const items = useMemo(() => {
    // 权限加载中时返回空（避免闪烁），PermissionContext 内部有 staleTime 缓存
    if (isLoading) return []
    return filterMenuByPermissions(allMenuItems, can, isViewer)
  }, [can, isLoading, isViewer])

  // 从路径中提取当前选中的菜单项和应该展开的祖先分组链
  const { selectedKey, ancestorKeys } = useMemo(() => {
    const path = pathname.slice(1) || 'dashboard'
    return {
      selectedKey: path,
      ancestorKeys: findAncestorMenuKeys(path, items),
    }
  }, [items, pathname])

  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    const path = pathname.slice(1) || 'dashboard'
    return findAncestorMenuKeys(path, items)
  })

  useEffect(() => {
    if (ancestorKeys.length === 0) return
    setOpenKeys((prevKeys) => {
      const missingKeys = ancestorKeys.filter((key) => !prevKeys.includes(key))
      if (missingKeys.length === 0) {
        return prevKeys
      }
      return [...prevKeys, ...missingKeys]
    })
  }, [ancestorKeys])

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (!key) return
    const targetPath = `/${key}`
    if (pathname !== targetPath) {
      navigate(targetPath)
    }
  }

  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys as string[])
  }

  return (
    <Menu
      onClick={onClick}
      selectedKeys={[selectedKey]}
      openKeys={openKeys}
      onOpenChange={onOpenChange}
      theme={isDarkMode ? 'dark' : 'light'}
      mode="inline"
      items={items}
    />
  )
}

export default MainMenu
