import { createContext, Dispatch, ReactNode, useContext } from 'react'
import { useLocalStorage } from '@hooks/useLocalStorage'

const DarkModeContext = createContext<{
  darkMode: boolean | Dispatch<React.SetStateAction<boolean>>
  setDarkMode: boolean | Dispatch<React.SetStateAction<boolean>>
}>({
  darkMode: false,
  setDarkMode: () => {},
})

function DarkModeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useLocalStorage(false, 'darkMode')

  return (
    <DarkModeContext.Provider
      value={{
        darkMode,
        setDarkMode,
      }}
    >
      {children}
    </DarkModeContext.Provider>
  )
}

const useDarkMode = () => {
  const context = useContext(DarkModeContext)
  if (context === undefined)
    throw new Error('useDarkMode must be used within a DarkModeProvider')
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export { DarkModeProvider, useDarkMode }
