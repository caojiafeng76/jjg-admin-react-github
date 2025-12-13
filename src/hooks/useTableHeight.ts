import { useState, useEffect, useRef } from 'react'

interface UseTableHeightOptions {
  targetRowCount?: number
  headerHeight?: number
  gap?: number
  summaryRowHeight?: number // 汇总行高度，用于有汇总行的表格
}

/**
 * 动态计算表格高度和行高，确保指定数量的行撑满容器
 * @param options 配置选项
 * @returns { tableContainerRef, paginationRef, scrollY, rowHeight }
 */
export function useTableHeight(options: UseTableHeightOptions = {}) {
  const {
    targetRowCount = 10,
    headerHeight = 39, // size="small" 的表头高度
    gap = 16, // gap-4 = 16px
    summaryRowHeight = 0, // 汇总行高度，默认0（无汇总行）
  } = options

  const tableContainerRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState<number>(400)
  const [rowHeight, setRowHeight] = useState<number>(40)
  const isUpdatingRef = useRef<boolean>(false) // 防止更新期间触发新的计算
  const lastCalculatedHeightRef = useRef<{ 
    container: number
    pagination: number
    rowHeight: number
    scrollY: number
  } | null>(null)

  useEffect(() => {
    const updateTableHeight = () => {
      // 如果正在更新中，跳过本次计算，避免循环
      if (isUpdatingRef.current) return
      
      const container = tableContainerRef.current
      const pagination = paginationRef.current
      if (!container || !pagination) return

      const containerHeight = container.clientHeight
      const paginationHeight = pagination.clientHeight

      // 如果容器高度和分页高度都没有变化（允许2px的容差），跳过计算
      // 这样可以避免因为表格内容变化导致的微小尺寸变化触发重新计算
      if (
        lastCalculatedHeightRef.current &&
        Math.abs(lastCalculatedHeightRef.current.container - containerHeight) <= 2 &&
        Math.abs(lastCalculatedHeightRef.current.pagination - paginationHeight) <= 2
      ) {
        return
      }

      // 可用高度 = 容器高度 - 分页高度 - gap
      // 为了确保10行能完全显示，减少扣除的值，给表格更多空间
      // 使用更小的缓冲空间，并稍微减少gap的扣除
      const availableHeight = containerHeight - paginationHeight - gap * 0.8 - 1

      if (availableHeight > 0) {
        // 表格总可用高度 = 容器高度 - 分页高度 - gap
        // 汇总行固定在表格底部，不参与滚动，需要从可用高度中减去
        const scrollableHeight = availableHeight - summaryRowHeight

        if (scrollableHeight > headerHeight) {
          // 计算行高：可滚动区域高度 / 目标行数
          // 可滚动区域 = 表头 + 数据行区域
          // antd的scroll.y只控制tbody区域，表头是独立的，所以需要减去表头高度
          const tableBodyHeight = scrollableHeight - headerHeight
          
          // 使用更精确的计算，确保10行能完全显示
          const calculatedRowHeight = tableBodyHeight / targetRowCount

          // 使用四舍五入确保行高为整数，同时保持行高和 scrollY 的一致性
          // 这样 scrollY = rowHeight × 10，确保10行能准确显示
          const newRowHeight = Math.max(32, Math.round(calculatedRowHeight)) // 最小行高32px，四舍五入
          
          // scrollY 必须等于 rowHeight × 10，确保10行能完全显示
          const newScrollY = Math.max(320, newRowHeight * targetRowCount)

          // 只有当计算结果真正改变时才更新状态
          // 添加阈值检查，避免因为微小变化导致的循环更新（2px 的容差）
          const shouldUpdate = !lastCalculatedHeightRef.current ||
            Math.abs(lastCalculatedHeightRef.current.rowHeight - newRowHeight) > 2 ||
            Math.abs(lastCalculatedHeightRef.current.scrollY - newScrollY) > 2 ||
            lastCalculatedHeightRef.current.container !== containerHeight ||
            lastCalculatedHeightRef.current.pagination !== paginationHeight

          if (shouldUpdate) {
            // 设置更新标志，防止在更新期间触发新的计算
            isUpdatingRef.current = true
            
            setRowHeight((prev) => {
              // 只有当变化超过2px时才更新，避免循环
              if (Math.abs(prev - newRowHeight) <= 2) {
                isUpdatingRef.current = false
                return prev
              }
              return newRowHeight
            })
            setScrollY((prev) => {
              // 只有当变化超过2px时才更新，避免循环
              if (Math.abs(prev - newScrollY) <= 2) {
                isUpdatingRef.current = false
                return prev
              }
              return newScrollY
            })

            // 记录当前计算的高度，用于下次比较
            lastCalculatedHeightRef.current = {
              container: containerHeight,
              pagination: paginationHeight,
              rowHeight: newRowHeight,
              scrollY: newScrollY,
            }
            
            // 使用 setTimeout 确保状态更新完成后再重置标志
            setTimeout(() => {
              isUpdatingRef.current = false
            }, 0)
          }
        }
      }
    }

    // 使用 requestAnimationFrame 延迟初始计算，确保 DOM 完全渲染
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(updateTableHeight)
    }, 0)

    // 使用防抖函数，避免频繁计算
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const debouncedUpdate = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = setTimeout(() => {
        requestAnimationFrame(updateTableHeight)
      }, 100) // 100ms 防抖
    }

    // 只监听容器的高度变化，分页组件的高度变化不应该影响表格高度计算
    // 分页组件的高度会在计算时实时获取
    const resizeObserver = new ResizeObserver((entries) => {
      // 只处理容器的高度变化，忽略分页组件的高度变化
      for (const entry of entries) {
        if (entry.target === tableContainerRef.current) {
          debouncedUpdate()
          break
        }
      }
    })
    
    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current)
    }

    window.addEventListener('resize', debouncedUpdate)

    return () => {
      clearTimeout(timeoutId)
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      resizeObserver.disconnect()
      window.removeEventListener('resize', debouncedUpdate)
    }
  }, [targetRowCount, headerHeight, gap, summaryRowHeight])

  return {
    tableContainerRef,
    paginationRef,
    scrollY,
    rowHeight,
  }
}

