import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface State {
  isDarkMode: boolean
}

interface Actions {
  setIsDarkMode: () => void
}

export const useAppStore = create<State & Actions>()(
  devtools(
    persist(
      immer(set => ({
        isDarkMode: false,

        setIsDarkMode: () => {
          set((state) => {
            state.isDarkMode = !state.isDarkMode
          })
        },
      })),
      {
        name: 'darkMode',
        partialize(state) {
          return { isDarkMode: state.isDarkMode }
        },
      },
    ),
  ),
)
