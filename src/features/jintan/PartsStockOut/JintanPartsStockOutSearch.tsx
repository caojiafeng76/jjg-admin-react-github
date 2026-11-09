import type { JintanFieldSearchValues } from '../JintanFieldSearch'
import { JINTAN_PARTS_SEARCH_FIELDS } from '@/services/jintanSearchFields'
import JintanFieldSearch from '../JintanFieldSearch'

interface Props {
  onSearch: (values: JintanFieldSearchValues) => void
  onReset: () => void
  values?: JintanFieldSearchValues
}

export default function JintanPartsStockOutSearch(props: Props) {
  return <JintanFieldSearch fields={JINTAN_PARTS_SEARCH_FIELDS} {...props} />
}
