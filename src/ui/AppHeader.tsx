import {
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
} from '@heroicons/react/16/solid'
import { Button } from 'antd'
import { Header } from 'antd/es/layout/layout'

import DarkModeButton from '@ui/DarkModeButton'

export default function AppHeader({
  colorBgContainer,
  collapsed,
  onToggleCollapse,
}: {
  colorBgContainer: string
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  return (
    <Header
      className="flex items-center"
      style={{ padding: 0, background: colorBgContainer }}
    >
      <Button
        type="text"
        icon={
          collapsed ? (
            <Bars3BottomRightIcon className="size-4" />
          ) : (
            <Bars3BottomLeftIcon className="size-4" />
          )
        }
        onClick={onToggleCollapse}
        style={{
          fontSize: 16,
          width: 64,
          height: 64,
        }}
      />

      <div className="mr-12 flex h-full flex-1 items-center justify-end">
        <DarkModeButton />
      </div>
    </Header>
  )
}
