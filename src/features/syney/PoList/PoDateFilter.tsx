import { DatePicker } from 'antd'
import { useSearchParams } from 'react-router-dom'
import dayjs, { Dayjs } from 'dayjs'
import { CalendarDaysIcon } from '@heroicons/react/16/solid'

const { RangePicker } = DatePicker

export default function PoDateFilter() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 从 URL 参数中读取日期
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const defaultValue: [Dayjs | null, Dayjs | null] | null | undefined =
    startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : undefined

  function handleDateChange(
    dates: null | [Dayjs | null, Dayjs | null],
    _dateStrings: [string, string],
  ) {
    if (dates && dates[0] && dates[1]) {
      searchParams.set('startDate', dates[0].format('YYYY-MM-DD'))
      searchParams.set('endDate', dates[1].format('YYYY-MM-DD'))
    } else {
      searchParams.delete('startDate')
      searchParams.delete('endDate')
    }
    searchParams.set('page', '1')
    setSearchParams(searchParams)
  }

  return (
    <RangePicker
      value={defaultValue}
      onChange={handleDateChange}
      format="YYYY-MM-DD"
      placeholder={['开始日期', '结束日期']}
      allowClear
      prefix={<CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400" />}
      className="w-64 rounded-lg"
    />
  )
}
