import type { TransformedOrderData } from '@utils/excelUtils'
import type { FormInstance } from 'antd'
import type { ISyneyItem, ISyneyPo } from '@/types'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { App, Modal } from 'antd'
import dayjs from 'dayjs'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTableHeight } from '@/hooks/useTableHeight'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import PrintButton from '@/ui/PrintButton'
import SelectedSummaryBar from '@/ui/SelectedSummaryBar'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import {
  getItemsWithExtraInfo,
  getItemsWithParamSpec,
  jsonToArray,
} from '@/utils/syney'
import { useSyneySpecs } from '../SpecList/useSyneySpecs'
import TableSelectionProvider from '../TableSelectionProvider'
import { useSyneySafePartSettings } from '../useSyneySafePartSettings'
import { useTableSelection } from '../useTableSelection'
import ExportInfoButton from './ExportInfoButton'
import ExportShippingListButton from './ExportShippingListButton'
import PoDateFilter from './PoDateFilter'
import PoForm from './PoForm'
import PoSearchInput from './PoSearchInput'
import PoSelected from './PoSelected'
import PoSelectedFilter from './PoSelectedFilter'
import PoTable from './PoTable'
import PrintDecompositionButton from './PrintDecompositionButton'
import { useCreatePo } from './useCreatePo'
import { useDeletePo } from './useDeletePo'
import { usePo } from './usePo'
import { usePos } from './usePos'
import { usePrint } from './usePrint'
import { usePrintEnglish } from './usePrintEnglish'
import { useUpdatePos } from './useUpdatePos'

function PoListContent() {
  const { message: messageApi } = App.useApp()
  const [searchParams] = useSearchParams()
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('创建订单')
  const [isEdit, setIsEdit] = useState(false)
  const [excelData, setExcelData] = useState<TransformedOrderData | null>(null)

  const poFormRef = useRef<FormInstance<ISyneyPo>>(null)

  const {
    count,
    pos,
    isLoading: posLoading,
    isFirstLoading: posFirstLoading,
    error: posError,
    refetch: posRefetch,
  } = usePos()
  const { tableSelectedKeys, setTableSelectedKeys } = useTableSelection()
  const [isCreating, setIsCreating] = useState(false)
  const { deletePo, isDeleting } = useDeletePo()
  const { updatePos, isUpdating: isPoUpdating } = useUpdatePos()

  const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
    isAll: !isEdit,
  })

  const { createPo } = useCreatePo()

  const { data: safePartSettings, isLoading: isSafePartSettingsLoading }
    = useSyneySafePartSettings()

  const { generateLabel, preloadPDF: preloadChineseLabelPDF } = usePrint(
    safePartSettings,
    isSafePartSettingsLoading,
  )
  const { generateEnglishLabel, preloadPDF: preloadEnglishLabelPDF }
    = usePrintEnglish(safePartSettings, isSafePartSettingsLoading)

  const records = useMemo(() => pos || [], [pos])
  const currentPoIds = useMemo(
    () =>
      records
        .map(record => record.id)
        .filter((id): id is number => typeof id === 'number'),
    [records],
  )
  const currentPoIdSet = useMemo(
    () => new Set(currentPoIds.map(String)),
    [currentPoIds],
  )
  const validSelectedKeys = useMemo(
    () => tableSelectedKeys.filter(key => currentPoIdSet.has(String(key))),
    [currentPoIdSet, tableSelectedKeys],
  )
  const selectedCount = validSelectedKeys.length
  const { data: po, isLoading: poLoading } = usePo(currentPoIds)
  const selectedQty = useMemo(() => {
    if (selectedCount === 0)
      return 0
    const keySet = new Set(validSelectedKeys.map(key => String(key)))
    let total = 0
    for (const item of records) {
      if (keySet.has(String(item.id))) {
        total += Number(item.Qty || 0)
      }
    }
    return total
  }, [records, selectedCount, validSelectedKeys])

  const handleDelete = useCallback(() => {
    if (tableSelectedKeys.length === 0) {
      messageApi.warning(feedbackText.selectRequired('删除'))
      return
    }
    deletePo(tableSelectedKeys.map(String), {
      onSettled: () => {
        setTableSelectedKeys([])
      },
    })
  }, [tableSelectedKeys, messageApi, deletePo, setTableSelectedKeys])

  const handleExcelDataChange = useCallback((data: TransformedOrderData) => {
    setExcelData(data)
  }, [])

  const onFinish = useCallback(
    async (values: ISyneyPo) => {
      if (specsLoading) {
        messageApi.warning('踏板规格加载中，请稍后再试')
        return
      }

      if (isSafePartSettingsLoading || !safePartSettings) {
        messageApi.warning('件号配置加载中，请稍后再试')
        return
      }

      try {
        const No = values.No
        values.EndDate = dayjs(values.EndDate?.toString() || '').format(
          'YYYY-MM-DD',
        )

        if (isEdit) {
          updatePos(
            { ids: tableSelectedKeys.map(String), data: values },
            {
              // 失败提示由 useUpdatePos 统一弹出；弹窗保持打开，便于修改后重试
              onSuccess: () => {
                setIsModalOpen(false)
                setTableSelectedKeys([])
              },
            },
          )
          return
        }

        let items: ISyneyItem[]

        if (excelData && excelData.items.length > 0) {
          items = excelData.items.map(item => ({
            ...item,
            No,
          })) as ISyneyItem[]
        }
        else {
          items = jsonToArray(values.Detail || '')
          items = items?.map(item => ({ ...item, No })) as ISyneyItem[]
        }
        // 不去重：ERP 同件号多行是上/下头部等独立零件（参数规格或备注不同），合并会丢失下头部规格与备注
        items = getItemsWithParamSpec(items, syneySpecs) as ISyneyItem[]

        const hasInferredParamSpec = items.some(
          item => item.ParamSpecInferred,
        )
        if (hasInferredParamSpec) {
          messageApi.warning('部分参数规格根据备注推测生成，请确认是否准确')
        }

        const uniqueSONos = new Set(items.map(item => item.SONo))
        const incrementBy = uniqueSONos.size

        const { atomicIncrementSerialNo }
          = await import('@/services/apiSyneySerialNo')
        const finalSerialNo = await atomicIncrementSerialNo(incrementBy)

        const startSerialNo = finalSerialNo - incrementBy

        const { map } = getItemsWithExtraInfo(
          items,
          startSerialNo,
          safePartSettings,
        )

        const { Detail, ...po } = values

        if (excelData) {
          if (excelData.po.Technique) {
            po.Technique = excelData.po.Technique
          }
          if (excelData.po.Remark) {
            po.Remark = excelData.po.Remark
          }
        }

        setIsCreating(true)

        await createPo({ po, map })
        // 仅成功时关闭弹窗；失败时保留已填内容与已解析的 Excel，便于修正后重试
        setIsModalOpen(false)
        setTableSelectedKeys([])
        setIsCreating(false)
        setExcelData(null)
      }
      catch (error) {
        console.error('订单创建失败:', error)
        messageApi.error(
          getUserErrorMessage(error, feedbackText.failed('创建', '订单')),
        )
        setIsCreating(false)
      }
    },
    [
      specsLoading,
      messageApi,
      isEdit,
      updatePos,
      tableSelectedKeys,
      setTableSelectedKeys,
      syneySpecs,
      setIsCreating,
      createPo,
      excelData,
      isSafePartSettingsLoading,
      safePartSettings,
    ],
  )

  const handlePrint = useCallback(() => {
    generateLabel()
    setTableSelectedKeys([])
  }, [generateLabel, setTableSelectedKeys])

  const handlePrintEnglish = useCallback(() => {
    generateEnglishLabel()
    setTableSelectedKeys([])
  }, [generateEnglishLabel, setTableSelectedKeys])

  const handleEdit = useCallback(() => {
    if (validSelectedKeys.length === 0) {
      if (tableSelectedKeys.length > 0) {
        setTableSelectedKeys([])
      }
      messageApi.warning(feedbackText.selectRequired('编辑'))
      return
    }

    setIsEdit(true)
    setTableSelectedKeys(validSelectedKeys)
    setModalTitle(
      validSelectedKeys.length === 1
        ? '编辑订单'
        : `批量编辑 ${validSelectedKeys.length} 个订单`,
    )
    setIsModalOpen(true)
  }, [
    messageApi,
    setTableSelectedKeys,
    tableSelectedKeys.length,
    validSelectedKeys,
  ])

  useEffect(() => {
    return () => {
      setIsCreating(false)
      setTableSelectedKeys([])
    }
    // eslint-disable-next-line react/exhaustive-deps
  }, [])

  const { tableContainerRef, paginationRef, scrollY } = useTableHeight({
    targetRowCount: 12,
    summaryRowHeight: 39,
  })

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton
          handleCreate={() => {
            setIsEdit(false)
            poFormRef.current?.resetFields()
            setModalTitle('创建订单')
            setIsModalOpen(true)
          }}
          permissionKey="feature:syney-po-list.create"
        />

        <EditButton
          title="编辑"
          handleEdit={handleEdit}
          permissionKey="feature:syney-po-list.edit"
        />

        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          count={tableSelectedKeys.length}
          title="删除订单"
          itemName="订单"
          permissionKey="feature:syney-po-list.delete"
        />

        <PrintButton
          handlePrint={handlePrint}
          onPreload={preloadChineseLabelPDF}
        >
          打印中文标签
        </PrintButton>
        <PrintButton
          handlePrint={handlePrintEnglish}
          onPreload={preloadEnglishLabelPDF}
        >
          打印英文标签
        </PrintButton>

        <ExportInfoButton />

        <ExportShippingListButton />

        <PrintDecompositionButton
          safePartSettings={safePartSettings}
          isSafePartSettingsLoading={isSafePartSettingsLoading}
        />
      </div>

      {/* 选中摘要条 */}
      {selectedCount > 0
        ? (
            <SelectedSummaryBar
              selectedCount={selectedCount}
              matchedCount={selectedCount}
              stats={[
                {
                  label: '选中数量合计',
                  value: selectedQty,
                  tone: 'error',
                  icon: <Bars3Icon className="size-3.5" />,
                },
              ]}
            />
          )
        : null}

      {/* 搜索 / 过滤栏 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300">交货日期：</span>
          <PoDateFilter />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300">状态：</span>
          <PoSelectedFilter />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300">搜索：</span>
          <PoSearchInput />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300">操作：</span>
          <PoSelected />
        </div>
      </div>

      {/* 表格和分页 */}
      <div className="grid flex-1 grid-rows-[1fr_auto] gap-3 overflow-hidden">
        <div ref={tableContainerRef} className="min-h-0 overflow-hidden">
          <TableState
            loading={posFirstLoading}
            error={posError}
            onRetry={posRefetch}
          >
            <PoTable
              loading={posLoading || isCreating || isPoUpdating}
              data={records}
              page={page}
              pageSize={pageSize}
              scrollY={scrollY}
            />
          </TableState>
        </div>
        <div ref={paginationRef} className="flex shrink-0 justify-end">
          <AppPagination total={count || 0} />
        </div>
      </div>

      <Modal
        title={modalTitle}
        loading={poLoading}
        open={isModalOpen}
        confirmLoading={isCreating || isPoUpdating}
        destroyOnHidden={true}
        width={720}
        onOk={() => poFormRef.current?.submit()}
        onCancel={() => {
          setIsModalOpen(false)
          setIsEdit(false)
        }}
      >
        <PoForm
          ref={poFormRef}
          onExcelDataChange={handleExcelDataChange}
          onFinish={onFinish}
          isCreating={isCreating}
          isEdit={isEdit}
          syneySpecs={syneySpecs}
          specsLoading={specsLoading}
          initialValues={
            (po && isEdit
              ? { ...po, EndDate: dayjs(po.EndDate) }
              : undefined) as ISyneyPo | undefined
          }
        />
      </Modal>
    </div>
  )
}

/** 选中状态随页面实例独立（多标签页缓存下互不影响） */
export default function PoList() {
  return (
    <TableSelectionProvider>
      <PoListContent />
    </TableSelectionProvider>
  )
}
