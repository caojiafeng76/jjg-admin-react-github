import FilterBar from '@/ui/FilterBar'
import WorkshopOrderSearch from './WorkshopOrderSearch'

interface Props {
  onSearch: Parameters<typeof WorkshopOrderSearch>[0]['onSearch']
  onReset: Parameters<typeof WorkshopOrderSearch>[0]['onReset']
  lengthOptions: number[]
}

export default function WorkshopOrderSearchPanel({
  onSearch,
  onReset,
  lengthOptions,
}: Props) {
  return (
    <FilterBar>
      <WorkshopOrderSearch
        onSearch={onSearch}
        onReset={onReset}
        lengthOptions={lengthOptions}
      />
    </FilterBar>
  )
}
