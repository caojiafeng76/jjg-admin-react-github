import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { Drawer, Empty, Input } from 'antd'

export interface MobileBottomSelectOption {
  value: string
  label: string
  description?: ReactNode
  keywords?: string
}

interface Props {
  open: boolean
  title: string
  options: MobileBottomSelectOption[]
  value?: string | null
  searchPlaceholder?: string
  emptyText?: string
  onClose: () => void
  onSelect: (value: string) => void
  onSearch?: (keyword: string) => void
}

export default function MobileBottomSelectSheet({
  open,
  title,
  options,
  value,
  searchPlaceholder = '请输入关键词搜索',
  emptyText = '暂无可选项',
  onClose,
  onSelect,
  onSearch,
}: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const deferredSearch = useDeferredValue(searchKeyword)

  useEffect(() => {
    if (!open) {
      setSearchInput('')
      setSearchKeyword('')
      setIsComposing(false)
      onSearch?.('')
    }
  }, [onSearch, open])

  const filteredOptions = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase()

    if (!keyword) {
      return options
    }

    return options.filter((option) => {
      const haystack = `${option.label} ${option.keywords || ''}`.toLowerCase()
      return haystack.includes(keyword)
    })
  }, [deferredSearch, options])

  return (
    <Drawer
      open={open}
      title={title}
      placement="bottom"
      size="72vh"
      onClose={onClose}
      destroyOnHidden
      styles={{
        body: {
          padding: 12,
        },
      }}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <Input
          value={searchInput}
          onChange={(event) => {
            const nextValue = event.target.value
            setSearchInput(nextValue)

            if (isComposing) {
              return
            }

            startTransition(() => {
              setSearchKeyword(nextValue)
              onSearch?.(nextValue)
            })
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(event) => {
            const nextValue = event.currentTarget.value
            setSearchInput(nextValue)
            setIsComposing(false)
            startTransition(() => {
              setSearchKeyword(nextValue)
              onSearch?.(nextValue)
            })
          }}
          placeholder={searchPlaceholder}
          allowClear
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {filteredOptions.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={emptyText}
              />
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {filteredOptions.map((option) => {
                const isActive = option.value === value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onSelect(option.value)
                      onClose()
                    }}
                    className={
                      isActive
                        ? 'w-full rounded-3xl border border-slate-900 bg-slate-900 px-4 py-3 text-left text-white shadow-[0_14px_30px_rgba(15,23,42,0.2)]'
                        : 'w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.06)]'
                    }
                  >
                    <div className="text-sm font-semibold tracking-tight">
                      {option.label}
                    </div>
                    {option.description ? (
                      <div
                        className={
                          isActive
                            ? 'mt-2 text-xs text-slate-200'
                            : 'mt-2 text-xs text-slate-500'
                        }
                      >
                        {option.description}
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}
