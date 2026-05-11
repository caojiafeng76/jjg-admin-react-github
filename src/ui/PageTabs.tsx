import { useEffect, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate, type Location } from 'react-router-dom'
import { Skeleton, Tabs, theme } from 'antd'
import type { TabsProps } from 'antd'

import { getDefaultHomeByRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { getRouteLabel } from '@/routes/routeLabels'

interface PageTab {
  key: string
  href: string
  label: string
  closable: boolean
}

function getLocationKey(location: Location, homeKey: string | null) {
  if (location.pathname === '/' && homeKey) {
    return homeKey
  }

  return location.pathname
}

function getLocationHref(location: Location, key: string) {
  if (location.pathname === '/') {
    return `${key}${location.search}${location.hash}`
  }

  return `${location.pathname}${location.search}${location.hash}`
}

function createPageTab(
  key: string,
  href: string,
  homeKey: string | null,
): PageTab {
  const label = getRouteLabel(key) || '未命名页面'

  return {
    key,
    href,
    label,
    closable: Boolean(homeKey) && key !== homeKey,
  }
}

function areTabsEqual(left: PageTab[], right: PageTab[]) {
  if (left.length !== right.length) return false

  return left.every((tab, index) => {
    const nextTab = right[index]
    return (
      tab.key === nextTab.key &&
      tab.href === nextTab.href &&
      tab.label === nextTab.label &&
      tab.closable === nextTab.closable
    )
  })
}

const tabsStyles: TabsProps['styles'] = {
  root: { margin: 0 },
  header: { margin: 0 },
  content: { display: 'none' },
}

const tabLabelStyle: CSSProperties = {
  display: 'inline-block',
  maxWidth: 132,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  verticalAlign: 'bottom',
  whiteSpace: 'nowrap',
}

export default function PageTabs() {
  const location = useLocation()
  const navigate = useNavigate()
  const { role, loading: authLoading } = useAuth()
  const [tabs, setTabs] = useState<PageTab[]>([])
  const {
    token: { colorBgContainer, colorBorderSecondary },
  } = theme.useToken()

  const homeKey = role ? getDefaultHomeByRole(role) : null
  const activeKey = getLocationKey(location, homeKey)
  const activeHref = getLocationHref(location, activeKey)

  useEffect(() => {
    setTabs((currentTabs) => {
      const nextTabs: PageTab[] = []

      if (homeKey) {
        const homeHref =
          activeKey === homeKey
            ? activeHref
            : currentTabs.find((tab) => tab.key === homeKey)?.href || homeKey
        nextTabs.push(createPageTab(homeKey, homeHref, homeKey))
      }

      for (const tab of currentTabs) {
        if (tab.key !== homeKey && tab.key !== activeKey) {
          nextTabs.push(createPageTab(tab.key, tab.href, homeKey))
        }
      }

      const activeTabIndex = nextTabs.findIndex((tab) => tab.key === activeKey)
      if (activeTabIndex === -1) {
        nextTabs.push(createPageTab(activeKey, activeHref, homeKey))
      } else {
        nextTabs[activeTabIndex] = createPageTab(activeKey, activeHref, homeKey)
      }

      return areTabsEqual(currentTabs, nextTabs) ? currentTabs : nextTabs
    })
  }, [activeHref, activeKey, homeKey])

  function handleChange(nextActiveKey: string) {
    const targetTab = tabs.find((tab) => tab.key === nextActiveKey)
    const targetHref = targetTab?.href || nextActiveKey

    if (nextActiveKey === activeKey || targetHref === activeHref) return

    navigate(targetHref)
  }

  const handleTabClick: TabsProps['onTabClick'] = (nextActiveKey, event) => {
    if (nextActiveKey !== activeKey) return

    event.preventDefault()
    event.stopPropagation()
  }

  function handleRemove(targetKey: string) {
    const targetTab = tabs.find((tab) => tab.key === targetKey)
    if (!targetTab?.closable) return

    const targetIndex = tabs.findIndex((tab) => tab.key === targetKey)
    const nextTabs = tabs.filter((tab) => tab.key !== targetKey)
    setTabs(nextTabs)

    if (targetKey === activeKey) {
      const nextActiveTab =
        nextTabs[targetIndex - 1] || nextTabs[targetIndex] || nextTabs[0]

      if (nextActiveTab) {
        navigate(nextActiveTab.href)
      }
    }
  }

  const handleEdit: TabsProps['onEdit'] = (targetKey, action) => {
    if (action === 'remove' && typeof targetKey === 'string') {
      handleRemove(targetKey)
    }
  }

  if (authLoading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          background: colorBgContainer,
          borderTop: `1px solid ${colorBorderSecondary}`,
          borderBottom: `1px solid ${colorBorderSecondary}`,
        }}
      >
        <Skeleton.Button active size="small" style={{ width: 64, minWidth: 64 }} />
        <Skeleton.Button active size="small" style={{ width: 80, minWidth: 80 }} />
        <Skeleton.Button active size="small" style={{ width: 72, minWidth: 72 }} />
      </div>
    )
  }

  const items: TabsProps['items'] = tabs.map((tab) => ({
    key: tab.key,
    label: (
      <span style={tabLabelStyle} title={tab.label}>
        {tab.label}
      </span>
    ),
    closable: tab.closable,
  }))

  return (
    <div
      className="px-2 py-1"
      style={{
        background: colorBgContainer,
        borderTop: `1px solid ${colorBorderSecondary}`,
        borderBottom: `1px solid ${colorBorderSecondary}`,
      }}
    >
      <Tabs
        activeKey={activeKey}
        hideAdd
        items={items}
        more={{ trigger: 'click' }}
        size="small"
        styles={tabsStyles}
        type="editable-card"
        onChange={handleChange}
        onEdit={handleEdit}
        onTabClick={handleTabClick}
      />
    </div>
  )
}
