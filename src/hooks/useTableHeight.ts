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

  useEffect(() => {
    const updateTableHeight = () => {
      const container = tableContainerRef.current
      const pagination = paginationRef.current
      if (!container || !pagination) return

      const containerHeight = container.clientHeight
      const paginationHeight = pagination.clientHeight

      // 可用高度 = 容器高度 - 分页高度 - gap
      // 增加 4px 的缓冲空间，确保分页组件完全显示
      const availableHeight = containerHeight - paginationHeight - gap - 4

      if (availableHeight > 0) {
        // 表格总可用高度 = 容器高度 - 分页高度 - gap
        // 汇总行固定在表格底部，不参与滚动，需要从可用高度中减去
        const scrollableHeight = availableHeight - summaryRowHeight

        if (scrollableHeight > headerHeight) {
          // 计算行高：可滚动区域高度 / 目标行数
          // 可滚动区域 = 表头 + 数据行区域
          const tableBodyHeight = scrollableHeight - headerHeight
          const calculatedRowHeight = Math.floor(tableBodyHeight / targetRowCount)

          // scrollY 仅为数据滚动区域高度，不包含表头和汇总行
          const calculatedScrollY = calculatedRowHeight * targetRowCount

          setRowHeight(Math.max(32, calculatedRowHeight)) // 最小行高32px
          setScrollY(Math.max(200, calculatedScrollY))
        }
      }
    }

    updateTableHeight()

    const resizeObserver = new ResizeObserver(updateTableHeight)
    if (tableContainerRef.current) {
      resizeObserver.observe(tableContainerRef.current)
    }
    if (paginationRef.current) {
      resizeObserver.observe(paginationRef.current)
    }

    window.addEventListener('resize', updateTableHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateTableHeight)
    }
  }, [targetRowCount, headerHeight, gap, summaryRowHeight])

  return {
    tableContainerRef,
    paginationRef,
    scrollY,
    rowHeight,
  }
}

