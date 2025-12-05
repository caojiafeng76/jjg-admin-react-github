import { DatePicker, Button, Space } from 'antd'
import { useState, useEffect } from 'react'
import { type Dayjs } from 'dayjs'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

interface Props {
  onSearch: (params: { startDate?: string; endDate?: string }) => void
  onReset: () => void
  initialStartDate?: string
  initialEndDate?: string
}

export default function ProductionSheetSearch({
  onSearch,
  onReset,
  initialStartDate,
  initialEndDate,
}: Props) {
  const getCurrentMonthRange = () => {
    const start = dayjs().startOf('month')
    const end = dayjs().endOf('month')
    return {
      start: initialStartDate ? dayjs(initialStartDate) : start,
      end: initialEndDate ? dayjs(initialEndDate) : end,
    }
  }

  const monthRange = getCurrentMonthRange()
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    monthRange.start,
    monthRange.end,
  ])

  useEffect(() => {
    if (initialStartDate && initialEndDate) {
      setDateRange([dayjs(initialStartDate), dayjs(initialEndDate)])
    }
  }, [initialStartDate, initialEndDate])

  const handleSearch = () => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      onSearch({
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      })
    } else {
      onSearch({})
    }
  }

  const handleReset = () => {
    const monthRange = getCurrentMonthRange()
    setDateRange([monthRange.start, monthRange.end])
    onReset()
  }

  return (
    <Space>
      <RangePicker
        value={dateRange}
        onChange={(dates) => setDateRange(dates)}
        format="YYYY-MM-DD"
        placeholder={['开始日期', '结束日期']}
      />
      <Button type="primary" onClick={handleSearch}>
        搜索
      </Button>
      <Button onClick={handleReset}>重置</Button>
    </Space>
  )
}

