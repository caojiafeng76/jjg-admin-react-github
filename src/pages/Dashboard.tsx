import { Button } from 'antd'
import { useSyneySpecs } from '@/features/syney/SpecList/useSyneySpecs'
import {
  distinctItems,
  getItemsWithParamSpec,
  jsonToArray,
} from '@/utils/syney'

import json from '@/storeInReport.json'

export default function Dashboard() {
  const { syneySpecs, isLoading } = useSyneySpecs({ isAll: true })
  return (
    <div>
      <Button
        type="primary"
        onClick={() => {
          if (!isLoading) {
            const items = getItemsWithParamSpec(json.data || [], syneySpecs)
            console.log(distinctItems(items))
          }
        }}
      >
        click
      </Button>
    </div>
  )
}
