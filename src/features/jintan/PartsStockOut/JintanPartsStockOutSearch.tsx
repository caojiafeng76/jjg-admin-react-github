import type { JintanPartsFieldSearchValues } from '../JintanPartCategoryFilterItem'
import { JINTAN_PARTS_SEARCH_FIELDS } from '@/services/jintanSearchFields'
import JintanFieldSearch from '../JintanFieldSearch'
import JintanPartCategoryFilterItem from '../JintanPartCategoryFilterItem'

interface Props {
  onSearch: (values: JintanPartsFieldSearchValues) => void
  onReset: () => void
  values?: JintanPartsFieldSearchValues
}

export default function JintanPartsStockOutSearch(props: Props) {
  return (
    <JintanFieldSearch<JintanPartsFieldSearchValues>
      fields={JINTAN_PARTS_SEARCH_FIELDS}
      {...props}
    >
      <JintanPartCategoryFilterItem />
    </JintanFieldSearch>
  )
}
