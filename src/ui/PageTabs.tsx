import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Skeleton, Tabs, theme } from 'antd'
import type { TabsProps } from 'antd'

import { getDefaultHomeByRole } from '@/config/access'
import { useAuth } from '@/contexts/useAuth'
import { getRouteLabel } from '@/routes/routeLabels'
import { getLocationKey, type PageLocation, type PageTab } from './pageTabsUtils'

function getLocationHref(location: PageLocation, key: string) {
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

interface PageTabsProps {
  onTabsChange?: (tabs: PageTab[]) => void
}

const MAX_CACHED_TABS = 8

export default function PageTabs({ onTabsChange }: PageTabsProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { role, loading: authLoading } = useAuth()
  const [tabs, setTabs] = useState<PageTab[]>([])
  const visitSequenceRef = useRef(0)
  const lastVisitedRef = useRef(new Map<string, number>())
  const {
    token: { colorBgContainer, colorBorderSecondary },
  } = theme.useToken()

  const homeKey = role ? getDefaultHomeByRole(role) : null
  const activeKey = getLocationKey(location, homeKey)
  const activeHref = getLocationHref(location, activeKey)

  useEffect(() => {
    visitSequenceRef.current += 1
    lastVisitedRef.current.set(activeKey, visitSequenceRef.current)

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

      while (nextTabs.length > MAX_CACHED_TABS) {
        const evictionCandidate = nextTabs
          .filter((tab) => tab.closable && tab.key !== activeKey)
          .reduce<PageTab | null>((oldest, tab) => {
            if (!oldest) return tab

            const oldestVisit = lastVisitedRef.current.get(oldest.key) ?? 0
            const tabVisit = lastVisitedRef.current.get(tab.key) ?? 0

            return tabVisit < oldestVisit ? tab : oldest
          }, null)

        if (!evictionCandidate) break

        nextTabs.splice(
          nextTabs.findIndex((tab) => tab.key === evictionCandidate.key),
          1,
        )
        lastVisitedRef.current.delete(evictionCandidate.key)
      }

      return areTabsEqual(currentTabs, nextTabs) ? currentTabs : nextTabs
    })
  }, [activeHref, activeKey, homeKey])

  useEffect(() => {
    onTabsChange?.(tabs)
  }, [onTabsChange, tabs])

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
    lastVisitedRef.current.delete(targetKey)

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

  function handleTabMouseDown(event: ReactMouseEvent<HTMLSpanElement>) {
    if (event.button !== 1) return

    event.preventDefault()
    event.stopPropagation()
  }

  function handleTabAuxClick(
    targetKey: string,
    event: ReactMouseEvent<HTMLSpanElement>,
  ) {
    if (event.button !== 1) return

    event.preventDefault()
    event.stopPropagation()
    handleRemove(targetKey)
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
      <span
        style={tabLabelStyle}
        title={tab.label}
        onAuxClick={(event) => handleTabAuxClick(tab.key, event)}
        onMouseDown={handleTabMouseDown}
      >
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
