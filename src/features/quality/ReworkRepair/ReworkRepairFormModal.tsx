import type { FormInstance } from 'antd'
import { Form, Modal } from 'antd'

import type { ProjectNoSelectOption } from '@/features/production-order/projectNoSelect'
import {
  ProductionFields,
  QualityFields,
  TechnicalFields,
  WorkshopFields,
} from './ReworkRepairStageFields'
import type {
  QualityReworkRepairFormFields,
  WorkflowStageConfig,
  WorkflowStageKey,
} from './reworkRepairFormUtils'

export interface ReworkRepairFormModalProps {
  form: FormInstance<QualityReworkRepairFormFields>
  open: boolean
  isEdit: boolean
  isSubmitting: boolean
  viewerDenied: boolean
  processingStage: WorkflowStageConfig
  processingStageKey: WorkflowStageKey
  isFetchingDocumentNo: boolean
  isLoadingOrderOptions: boolean
  projectNoOptions: ProjectNoSelectOption[]
  onProjectNoChange: (projectNo: string) => void
  onFinish: () => void | Promise<void>
  onCancel: () => void
}

export default function ReworkRepairFormModal({
  form,
  open,
  isEdit,
  isSubmitting,
  viewerDenied,
  processingStage,
  processingStageKey,
  isFetchingDocumentNo,
  isLoadingOrderOptions,
  projectNoOptions,
  onProjectNoChange,
  onFinish,
  onCancel,
}: ReworkRepairFormModalProps) {
  return (
    <Modal
      title={isEdit ? processingStage.modalTitle : '新建返工返修记录'}
      open={open}
      width={980}
      destroyOnHidden
      okText={isEdit ? processingStage.okText : '保存车间发起'}
      cancelText="取消"
      confirmLoading={isSubmitting}
      onOk={() => form.submit()}
      onCancel={onCancel}
      okButtonProps={{ disabled: viewerDenied }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        disabled={isSubmitting || viewerDenied}
      >
        {processingStageKey === 'production' ? (
          <ProductionFields />
        ) : processingStageKey === 'technical' ? (
          <TechnicalFields />
        ) : processingStageKey === 'quality' ? (
          <QualityFields />
        ) : processingStageKey === 'completed' ? (
          <>
            <WorkshopFields
              isFetchingDocumentNo={isFetchingDocumentNo}
              isLoadingOrderOptions={isLoadingOrderOptions}
              projectNoOptions={projectNoOptions}
              onProjectNoChange={onProjectNoChange}
            />
            <ProductionFields />
            <TechnicalFields />
            <QualityFields />
          </>
        ) : (
          <WorkshopFields
            isFetchingDocumentNo={isFetchingDocumentNo}
            isLoadingOrderOptions={isLoadingOrderOptions}
            projectNoOptions={projectNoOptions}
            onProjectNoChange={onProjectNoChange}
          />
        )}
      </Form>
    </Modal>
  )
}
