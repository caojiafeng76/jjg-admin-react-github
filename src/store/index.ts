import { Key } from 'react'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

type State = {
  tableSelectedKeys: Key[]
  isDarkMode: boolean
}

type Actions = {
  setTableSelectedKeys: (keys: Key[]) => void
  setIsDarkMode: () => void
}

export const useAppStore = create<State & Actions>()(
  devtools(
    persist(
      immer((set) => ({
        tableSelectedKeys: [] as Key[],
        isDarkMode: false,

        setIsDarkMode: () => {
          set((state) => {
            state.isDarkMode = !state.isDarkMode
          })
        },

        setTableSelectedKeys: (keys) =>
          set((state) => {
            state.tableSelectedKeys = keys
          }),
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
