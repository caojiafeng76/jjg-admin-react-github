import type { MenuProps } from 'antd'
import type { PageTab } from './pageTabsUtils'
import { Menu } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { isViewerRole } from '@/config/access'
import { useAuth, usePermissionContext } from '@/contexts'

import { useAppStore } from '@/store'
import {
  allMenuItems,
  filterMenuByPermissions,
  findAncestorMenuKeys,
} from './mainMenuItems'

// ----------------------------------------------------------------
// MainMenu 组件
// ----------------------------------------------------------------
interface MainMenuProps {
  /** 当前已打开的标签页：点击菜单进入已打开页面时恢复该标签记录的完整地址（含筛选参数） */
  tabs?: PageTab[]
}

const MainMenu: React.FC<MainMenuProps> = ({ tabs }) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { can, isLoading } = usePermissionContext()
  const { role } = useAuth()
  const isViewer = isViewerRole(role)
  const isDarkMode = useAppStore(state => state.isDarkMode)

  const items = useMemo(() => {
    // 权限加载中时返回空（避免闪烁），PermissionContext 内部有 staleTime 缓存
    if (isLoading)
      return []
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
    if (ancestorKeys.length === 0)
      return
    setOpenKeys((prevKeys) => {
      const missingKeys = ancestorKeys.filter(key => !prevKeys.includes(key))
      if (missingKeys.length === 0) {
        return prevKeys
      }
      return [...prevKeys, ...missingKeys]
    })
  }, [ancestorKeys])

  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (!key)
      return
    const targetPath = `/${key}`
    if (pathname !== targetPath) {
      // 与标签切换行为一致：已打开的页面恢复其筛选/分页地址，避免 URL 与页面内筛选状态不一致
      const openedTab = tabs?.find(tab => tab.key === targetPath)
      navigate(openedTab?.href || targetPath)
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
