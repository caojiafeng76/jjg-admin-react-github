import EditButton from '@/ui/EditButton'
import DetailTable from './DetailTable'
import { App, Modal } from 'antd'
import DetailForm from './DetailForm'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '@/store'
import { FormInstance } from 'antd/lib'
import { ISyneyItem } from '@/types'
import { useItem } from './useItem'
import { useDetail } from './useDetail'
import { useTableHeight } from '@/hooks/useTableHeight'
import AppPagination from '@/ui/AppPagination'
import { useParams, useSearchParams } from 'react-router-dom'

export default function PoDetail() {
  const { message } = App.useApp()
  const { PoId } = useParams()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isLoading = useAppStore((state) => state.isLoading)
  const setTableSelectedKeys = useAppStore(
    (state) => state.setTableSelectedKeys,
  )
  const { items, isLoading: isDetailLoading } = useDetail()

  const detailFormRef = useRef<{
    getInstance: () => FormInstance<ISyneyItem>
  }>(null)

  const records = useMemo(() => (items as ISyneyItem[]) || [], [items])
  const currentItemIds = useMemo(
    () =>
      records
        .map((item) => item.id)
        .filter((id): id is number => typeof id === 'number'),
    [records],
  )
  const { data } = useItem(currentItemIds)
  const total = records.length

  useEffect(() => {
    setTableSelectedKeys([])
  }, [PoId, setTableSelectedKeys])

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 39,
  })

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <EditButton
          title="选择至少一条数据"
          handleEdit={() => {
            if (!data) {
              message.warning('请先选择一条数据进行编辑')
              return
            }
            setIsModalOpen(true)
            setTimeout(() => {
              detailFormRef.current
                ?.getInstance()
                .setFieldsValue(data as ISyneyItem)
            }, 0)
          }}
        />
      </div>

      {/* 表格 + 分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <DetailTable
            loading={isLoading || isDetailLoading}
            data={records}
            page={page}
            pageSize={pageSize}
            scrollY={scrollY}
          />
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={total} />
        </div>
      </div>

      <Modal
        title="编辑明细"
        open={isModalOpen}
        confirmLoading={isLoading}
        width={560}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => {
          detailFormRef.current?.getInstance().submit()
        }}
      >
        <DetailForm
          ref={detailFormRef}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
