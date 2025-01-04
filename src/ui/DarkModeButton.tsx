import { useAppStore } from '@/store'
import { MoonIcon, SunIcon } from '@heroicons/react/16/solid'
import { Button } from 'antd'

export default function DarkModeButton() {
  const { isDarkMode, setIsDarkMode } = useAppStore()

  return (
    <Button type="text" onClick={setIsDarkMode}>
      {isDarkMode ? (
        <SunIcon className="size-4" />
      ) : (
        <MoonIcon className="size-4" />
      )}
    </Button>
  )
}
