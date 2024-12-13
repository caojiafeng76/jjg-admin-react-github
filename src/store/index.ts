import { Key } from 'react'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

type State = {
  tableSelectedKeys: Key[]
  isLoading: boolean
  isDarkMode: boolean
}

type Actions = {
  setTableSelectedKeys: (keys: Key[]) => void
  setIsLoading: (isLoading: boolean) => void
  setIsDarkMode: () => void
}

export const useStore = create<State & Actions>()(
  devtools(
    persist(
      immer((set) => ({
        tableSelectedKeys: [] as Key[],
        isLoading: false,
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

        setIsLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading
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
