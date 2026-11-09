import type { JintanFieldSearchValues } from '../JintanFieldSearch'
import { JINTAN_MATERIALS_SEARCH_FIELDS } from '@/services/jintanSearchFields'
import JintanFieldSearch from '../JintanFieldSearch'

interface Props {
  onSearch: (values: JintanFieldSearchValues) => void
  onReset: () => void
  values?: JintanFieldSearchValues
}

export default function JintanMaterialsStockOutSearch(props: Props) {
  return <JintanFieldSearch fields={JINTAN_MATERIALS_SEARCH_FIELDS} {...props} />
}
