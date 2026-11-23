import type { TransformedOrderData } from '@utils/excelUtils'
import type { FormInstance } from 'antd'
import type { PoImportMode } from './PoImportMode'
import type { ISyneyItem, ISyneyPo } from '@/types'
import { Bars3Icon } from '@heroicons/react/24/outline'
import { App, Modal } from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useTableHeight } from '@/hooks/useTableHeight'
import { SYNEY_PURCHASE_ORDER_NO_PATTERN } from '@/services/syneyDeliveryOrderContract'
import AddButton from '@/ui/AddButton'
import AppPagination from '@/ui/AppPagination'
import DeleteButton from '@/ui/DeleteButton'
import EditButton from '@/ui/EditButton'
import FilterBar from '@/ui/FilterBar'
import PrintButton from '@/ui/PrintButton'
import SelectedSummaryBar from '@/ui/SelectedSummaryBar'
import { TableState } from '@/ui/TableState'
import { getUserErrorMessage } from '@/utils/errorHandler'
import { feedbackText } from '@/utils/feedbackText'
import { jsonToArray } from '@/utils/syney'
import {
  buildSyneyPurchaseOrderPayload,
  prepareManualOrExcelPoGroups,
} from '@/utils/syneyPurchaseOrder'
import { useSyneySpecs } from '../SpecList/useSyneySpecs'
import TableSelectionProvider from '../TableSelectionProvider'
import { useSyneySafePartSettings } from '../useSyneySafePartSettings'
import { useTableSelection } from '../useTableSelection'
import DeliveryOrderButton from './DeliveryOrderButton'
import ExportInfoButton from './ExportInfoButton'
import ExportShippingListButton from './ExportShippingListButton'
import PoDateFilter from './PoDateFilter'
import PoForm from './PoForm'
import { PoImportModePicker } from './PoImportMode'
import PoSearchInput from './PoSearchInput'
import PoSelected from './PoSelected'
import PoSelectedFilter from './PoSelectedFilter'
import PoTable from './PoTable'
import PrintDecompositionButton from './PrintDecompositionButton'
import { SyneyPurchaseOrderModal } from './SyneyPurchaseOrderModal'
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
  const [importMode, setImportMode] = useState<PoImportMode>('scm')
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
  const { deletePo, isDeleting } = useDeletePo()
  const { updatePos, isUpdating: isPoUpdating } = useUpdatePos()

  const { syneySpecs, isLoading: specsLoading } = useSyneySpecs({
    isAll: true,
    enabled: isModalOpen && !isEdit,
    silentError: true,
  })

  const { createPo, isCreating } = useCreatePo()

  const { data: safePartSettings, isLoading: isSafePartSettingsLoading }
    = useSyneySafePartSettings()

  const {
    generateLabel,
    preloadPDF: preloadChineseLabelPDF,
    isPrinting: isPrintingChinese,
  } = usePrint(safePartSettings, isSafePartSettingsLoading)
  const {
    generateEnglishLabel,
    preloadPDF: preloadEnglishLabelPDF,
    isPrinting: isPrintingEnglish,
  } = usePrintEnglish(safePartSettings, isSafePartSettingsLoading)

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
  const { data: po, isLoading: poLoading } = usePo(
    currentPoIds,
    isModalOpen && isEdit,
  )
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

  function changeImportMode(mode: PoImportMode) {
    setExcelData(null)
    setImportMode(mode)
  }

  const handleExcelDataChange = useCallback((data: TransformedOrderData) => {
    setExcelData(data)
  }, [])

  const onFinish = useCallback(
    async (values: ISyneyPo) => {
      try {
        const formattedEndDate = values.EndDate
          ? dayjs(values.EndDate).format('YYYY-MM-DD')
          : ''

        if (isEdit) {
          updatePos(
            {
              ids: tableSelectedKeys.map(String),
              data: { ...values, EndDate: formattedEndDate },
            },
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

        if (specsLoading) {
          messageApi.warning('踏板规格加载中，请稍后再试')
          return
        }

        if (isSafePartSettingsLoading || !safePartSettings) {
          messageApi.warning('件号配置加载中，请稍后再试')
          return
        }

        const poNo = values.No?.trim() ?? ''
        if (!SYNEY_PURCHASE_ORDER_NO_PATTERN.test(poNo)) {
          messageApi.warning('请输入有效的西尼采购单号（仅支持字母、数字、下划线和连字符）')
          return
        }

        let items: ISyneyItem[]

        if (importMode === 'excel') {
          if (!excelData?.items.length) {
            messageApi.warning('请先选择有效的 Excel 文件')
            return
          }
          items = excelData.items.map(item => ({
            ...item,
            No: poNo,
          })) as ISyneyItem[]
        }
        else {
          items = jsonToArray(values.Detail || '')
          if (!items.length) {
            messageApi.warning('请输入有效的订单明细')
            return
          }
          items = items.map(item => ({ ...item, No: poNo }))
        }

        const { groups, hasInferredParamSpec } = prepareManualOrExcelPoGroups({
          order: {
            endDate: formattedEndDate,
            spec: values.Spec,
            brand: values.Brand || (importMode === 'excel' ? excelData?.po.Brand : null),
            technique: importMode === 'excel' ? excelData?.po.Technique : null,
            remark:
              values.Remark !== undefined
                ? values.Remark
                : (importMode === 'excel' ? excelData?.po.Remark : null),
          },
          items,
          specs: syneySpecs || [],
        })

        if (hasInferredParamSpec) {
          messageApi.warning('部分参数规格根据备注推测生成，请确认是否准确')
        }

        const result = await createPo({
          poNo,
          groups: buildSyneyPurchaseOrderPayload(groups, safePartSettings),
        })

        if (result.created === 0) {
          messageApi.warning('该采购单下的生产编号已全部建单，未新增订单')
          return
        }

        messageApi.success(
          result.skipped > 0
            ? `${feedbackText.batch('新增', '订单', result.created)}，跳过 ${result.skipped} 条已存在订单`
            : feedbackText.batch('新增', '订单', result.created),
        )
        setIsModalOpen(false)
        setTableSelectedKeys([])
        setExcelData(null)
      }
      catch (error) {
        console.error('订单创建失败:', error)
        messageApi.error(
          getUserErrorMessage(error, feedbackText.failed('创建', '订单')),
        )
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
      createPo,
      excelData,
      importMode,
      isSafePartSettingsLoading,
      safePartSettings,
    ],
  )

  const handlePrint = useCallback(async () => {
    const success = await generateLabel()
    if (success) {
      setTableSelectedKeys([])
    }
  }, [generateLabel, setTableSelectedKeys])

  const handlePrintEnglish = useCallback(async () => {
    const success = await generateEnglishLabel()
    if (success) {
      setTableSelectedKeys([])
    }
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
      setTableSelectedKeys([])
    }
  }, [setTableSelectedKeys])

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
            changeImportMode('scm')
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

        <PrintButton
          handlePrint={() => void handlePrint()}
          loading={isPrintingChinese}
          onPreload={preloadChineseLabelPDF}
        >
          打印中文标签
        </PrintButton>
        <PrintButton
          handlePrint={() => void handlePrintEnglish()}
          loading={isPrintingEnglish}
          onPreload={preloadEnglishLabelPDF}
        >
          打印英文标签
        </PrintButton>

        <ExportInfoButton />

        <ExportShippingListButton />

        <DeliveryOrderButton />

        <PrintDecompositionButton
          safePartSettings={safePartSettings}
          isSafePartSettingsLoading={isSafePartSettingsLoading}
        />

        <DeleteButton
          onConfirm={handleDelete}
          isDeleting={isDeleting}
          count={tableSelectedKeys.length}
          title="删除订单"
          itemName="订单"
          permissionKey="feature:syney-po-list.delete"
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
      <FilterBar>
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
      </FilterBar>

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

      {isModalOpen && !isEdit && (importMode === 'scm' || importMode === 'loose-parts') && (
        <SyneyPurchaseOrderModal
          mode={importMode}
          onModeChange={changeImportMode}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      <Modal
        title={modalTitle}
        loading={isEdit && poLoading}
        open={isModalOpen && (isEdit || (importMode !== 'scm' && importMode !== 'loose-parts'))}
        confirmLoading={isCreating || isPoUpdating}
        destroyOnHidden={true}
        width={720}
        onOk={() => poFormRef.current?.submit()}
        onCancel={() => {
          setIsModalOpen(false)
          setIsEdit(false)
        }}
      >
        {!isEdit && <PoImportModePicker value={importMode} onChange={changeImportMode} disabled={isCreating} />}
        <PoForm
          key={isEdit ? 'edit' : importMode}
          importMode={isEdit || importMode === 'scm' || importMode === 'loose-parts' ? 'manual' : importMode}
          ref={poFormRef}
          onExcelDataChange={handleExcelDataChange}
          onFinish={onFinish}
          isCreating={isCreating || isPoUpdating}
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
