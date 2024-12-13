// import { useSyneySpecs } from '@/features/syney/SpecList/useSyneySpecs'
// import json from '@/poItems.json'
// import { ISyneyItem } from '@/types'
// import { getItemsWithParamSpec } from '@/utils/syney'

import PoList from '@/features/syney/PoList'
// import { getSyneyPos } from '@/services/apiSyneyPos'
// import { Button } from 'antd'

export default function SyneyPoList() {
  // const data = json.data

  // const partNosOfComb = ['XN2808EB', 'XN3024BR']
  // const partNosOfCover = [
  //   'XN2808BP',
  //   'XN2808BQ',
  //   'XN3024BS',
  //   'XN3024BT',
  //   'XN2808AF',
  //   'XN3024BX',
  //   'XN3024BY',
  //   'XN2808AL',
  // ]

  // const { isLoading, syneySpecs } = useSyneySpecs({ isAll: true })

  // if (!isLoading) {
  //   const d = getItemsWithParamSpec(data, syneySpecs)

  //   d.forEach((item) => {
  //     item.No = 'P202411190317'
  //   })

  //   const map = new Map<string, ISyneyItem[]>()
  //   let serialNo = 4647

  //   new Set(d.map((item) => item.SONo)).forEach((sono) => {
  //     const seNo = serialNo + 1

  //     partNosOfComb.forEach((partNo) => {
  //       d.filter((item) => item.SONo === sono).forEach((item) => {
  //         if (item.PartNo?.includes(partNo)) {
  //           item.PartName2 = '梳齿支撑板'
  //           item.SerialNo = `ZC00${seNo}`
  //         }
  //       })
  //     })

  //     partNosOfCover.forEach((partNo) => {
  //       d.filter((item) => item.SONo === sono).forEach((item) => {
  //         if (item.PartNo?.includes(partNo)) {
  //           item.PartName2 = '楼层板'
  //           item.SerialNo = `LC00${seNo}`
  //         }
  //       })
  //     })

  //     map.set(
  //       sono!,
  //       d.filter((item) => item.SONo === sono),
  //     )
  //     serialNo += 1
  //   })

  //   console.log(map)
  // }

  return <PoList />
}
