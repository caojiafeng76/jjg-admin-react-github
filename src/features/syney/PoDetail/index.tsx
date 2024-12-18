import EditButton from '@/ui/EditButton'
import DetailTable from './DetailTable'
import { Modal } from 'antd'
import DetailForm from './DetailForm'
import { useRef, useState } from 'react'
import { useStore } from '@/store'
import { FormInstance } from 'antd/lib'
import { PoDetailFormType } from '@/types'
import { useItem } from './useItem'

export default function PoDetail() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { isLoading } = useStore()
  const { data } = useItem()

  const detailFormRef = useRef<{
    getInstance: () => FormInstance<PoDetailFormType>
  }>(null)

  return (
    <div className="grid grid-rows-[32px_1fr] gap-4">
      <div className="flex h-full items-center gap-2">
        <EditButton
          title="选择至少一条数据"
          handleEdit={() => {
            setIsModalOpen(true)
            setTimeout(() => {
              detailFormRef.current
                ?.getInstance()
                .setFieldsValue(data as PoDetailFormType)
            }, 0)
          }}
        />
      </div>

      <div className="no-scrollbar overflow-y-scroll">
        <DetailTable />

        <Modal
          title="编辑明细"
          open={isModalOpen}
          confirmLoading={isLoading}
          onCancel={() => setIsModalOpen(false)}
          onOk={() => setIsModalOpen(false)}
        >
          <DetailForm
            ref={detailFormRef}
            onClose={() => setIsModalOpen(false)}
          />
        </Modal>
      </div>
    </div>
  )
}
