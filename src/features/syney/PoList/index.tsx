import { useRef, useState } from 'react'
import { message, Modal } from 'antd'
import { format } from 'date-fns'
import dayjs from 'dayjs'

import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import PoTable from './PoTable'
import PoForm from './PoForm'
import { useStore } from '@/store'
import { ISyneyItem, ISyneyPo, ISyneyPoFormRef } from '@/types'
import DeleteButton from '@/ui/DeleteButton'
import { useDeletePo } from './useDeletePo'
import { usePos } from './usePos'
import PrintButton from '@/ui/PrintButton'
import { usePrint } from './usePrint'
import ExportInfoButton from './ExportInfoButton'
import { useSyneySpecs } from '../SpecList/useSyneySpecs'
import { useSerialNo } from './useSerialNo'
import { useCreatePo } from './useCreatePo'
import { useUpdateSerialNo } from './useUpdateSerialNo'
import {
  getItemsWithExtraInfo,
  getItemsWithParamSpec,
  jsonToArray,
} from '@/utils/syney'
import PoSelected from './PoSelected'
import EditButton from '@/ui/EditButton'
import { usePo } from './usePo'
import { useUpdatePos } from './useUpdatePos'
import PrintDecompositionButton from './PrintDecompositionButton'
import PoSelectedFilter from './PoSelectedFilter'

export default function PoList() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建订单')
  const [isEdit, setIsEdit] = useState(false)

  const { generateLabel } = usePrint()

  const poFormRef = useRef<ISyneyPoFormRef>(null)

  const { count } = usePos()
  const { tableSelectedKeys, setTableSelectedKeys } = useStore()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const { isDeleting, deletePo } = useDeletePo()
  const { data: po, isLoading: poLoading } = usePo()
  const { updatePos, isUpdating: isPoUpdating } = useUpdatePos()

  const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
    isAll: true,
  })
  const { serialNo, isLoading: serialNoLoading } = useSerialNo()

  const { createPo, isCreating } = useCreatePo()
  const { updateSerialNo, isUpdating } = useUpdateSerialNo()

  function handleDelete() {
    deletePo(tableSelectedKeys.map(String), {
      onSettled: () => {
        setIsConfirmOpen(false)
        setTableSelectedKeys([])
      },
    })
  }

  function showPopconfirm() {
    // 检查数据源长度是否为0
    if (tableSelectedKeys?.length === 0) {
      // 如果数据源为空，显示警告信息并设置确认打开状态为false
      message.warning('请选择至少一条数据')
      setIsConfirmOpen(false)
    } else {
      // 如果数据源不为空，设置确认打开状态为新的打开状态
      setIsConfirmOpen(true)
    }
  }

  async function onFinish(values: ISyneyPo) {
    if (!specsLoading && !serialNoLoading && !isUpdating) {
      const No = values.No
      values.EndDate = format(values.EndDate?.toString() || '', 'yyyy-MM-dd')

      if (isEdit) {
        updatePos(
          { ids: tableSelectedKeys.map(String), data: values },
          {
            onSettled: () => {
              setIsModalOpen(false)
              setTableSelectedKeys([])
            },
          },
        )
        return
      }

      let items = jsonToArray(values.Detail || '')
      items = items?.map((item) => ({ ...item, No })) as ISyneyItem[]
      items = getItemsWithParamSpec(items, syneySpecs) as ISyneyItem[]
      const { map, tmpSerialNo } = getItemsWithExtraInfo(
        items,
        serialNo?.SyneySerialNo || 0,
      )
      updateSerialNo(tmpSerialNo)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { Detail, ...po } = values

      await createPo(
        { po, map },
        {
          onSettled: () => {
            setIsModalOpen(false)
            setTableSelectedKeys([])
          },
        },
      )
    }
  }

  function handlePrint() {
    generateLabel()
    setTableSelectedKeys([])
  }

  function handleEdit() {
    setIsEdit(true)
    setIsModalOpen(true)
    if (!poLoading && po) {
      setTimeout(() => {
        poFormRef.current
          ?.getInstance()
          .setFieldsValue({ ...po, EndDate: dayjs(po.EndDate) as any })
        setModalTitle('编辑订单')
      }, 0)
    }
  }

  return (
    <div className="grid grid-rows-[32px_1fr] gap-4">
      <div className="flex h-full items-center gap-2">
        <AddButton
          handleCreate={() => {
            setIsEdit(false)
            poFormRef.current?.getInstance().resetFields()
            setModalTitle('创建订单')
            setIsModalOpen(true)
          }}
        />

        <EditButton title="编辑" handleEdit={handleEdit} />

        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          showPopconfirm={showPopconfirm}
          open={isConfirmOpen}
          closeConfirm={() => setIsConfirmOpen(false)}
        />

        <PrintButton handlePrint={handlePrint} />

        <ExportInfoButton />

        <PrintDecompositionButton />

        <span>操作：</span>
        <PoSelected />

        <span>过滤：</span>
        <PoSelectedFilter />
      </div>

      <div className="no-scrollbar overflow-y-scroll">
        <PoTable />

        <AppPagination total={count || 0} />

        <Modal
          title={modalTitle}
          loading={poLoading}
          open={isModalOpen}
          confirmLoading={isCreating || isPoUpdating}
          // destroyOnClose={true}
          onOk={poFormRef.current?.getInstance().submit}
          onCancel={() => setIsModalOpen(false)}
        >
          <PoForm
            ref={poFormRef}
            onFinish={onFinish}
            isCreating={isCreating || isUpdating}
            isEdit={isEdit}
          />
        </Modal>
      </div>
    </div>
  )
}
