import DetailTable from './DetailTable'

export default function PoDetail() {
  return (
    <div className="grid grid-rows-[32px_1fr] gap-4">
      <div className="flex h-full items-center gap-2"></div>

      <div className="no-scrollbar overflow-y-scroll">
        <DetailTable />
      </div>
    </div>
  )
}
