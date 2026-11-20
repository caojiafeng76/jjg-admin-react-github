import type { FormInstance } from 'antd'
import type { JintanPartsStockOutFormValues } from '@/services/apiJintanPartsStockOut'
import PublicQrPageShell from '@ui/PublicQrPageShell'
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Result,
  Select,
  Spin,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'

import { formatJintanColor, jintanColorSegment } from '@/services/jintanColor'
import { usePublicJintanPartsInventoryOptions } from '../PartsInventory/useJintanPartsInventory'
import { useCreatePublicJintanPartsStockOut } from './useJintanPartsStockOut'

interface SubmissionSnapshot {
  partLabel: string
  quantity: number
  remarks: string
}

interface PublicFormFields {
  inventory_id: string
  quantity: number | null
  remarks: string
}

export default function JintanPartsStockOutPublicPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm<PublicFormFields>()
  const [formRef, setFormRef] = useState<FormInstance | null>(null)
  const [keyword, setKeyword] = useState('')
  const [submitted, setSubmitted] = useState<SubmissionSnapshot | null>(null)

  const {
    data: options = [],
    isLoading: isOptionsQueryLoading,
    isFetching: isOptionsFetching,
    error: optionsError,
    refetch: refetchOptions,
  } = usePublicJintanPartsInventoryOptions(keyword)
  const createMutation = useCreatePublicJintanPartsStockOut()
  const selectedInventoryId = Form.useWatch('inventory_id', form)
  const selected = options.find(option => option.id === selectedInventoryId)

  useEffect(() => {
    setFormRef(form)
  }, [form])

  const selectOptions = useMemo(
    () =>
      options.map(option => ({
        value: option.id,
        label: `${option.part_category} / ${option.item_type} / ${option.part_name} / ${option.specification || '无规格'}${jintanColorSegment(option.color)}（库存 ${option.quantity}）`,
      })),
    [options],
  )

  const hasOptions = keyword.trim().length > 0 || options.length > 0
  const isInitialLoading = keyword.trim().length === 0 && isOptionsQueryLoading

  const handleFinish = async (values: PublicFormFields) => {
    if (!values.inventory_id) {
      message.warning('请选择配件')
      return
    }

    const payload: JintanPartsStockOutFormValues = {
      inventory_id: values.inventory_id,
      quantity: Number(values.quantity),
      remarks: (values.remarks ?? '').trim(),
    }

    try {
      await createMutation.mutateAsync(payload)

      const submittedOption = options.find(
        item => item.id === payload.inventory_id,
      )
      setSubmitted({
        partLabel: submittedOption
          ? `${submittedOption.part_category} / ${submittedOption.item_type} / ${submittedOption.part_name} / ${submittedOption.specification || '无规格'}${jintanColorSegment(submittedOption.color)}`
          : '配件出库',
        quantity: payload.quantity,
        remarks: payload.remarks || '无',
      })
      form.resetFields()
      setKeyword('')
    }
    catch (error) {
      message.error(
        error instanceof Error ? error.message : '登记失败，请稍后重试',
      )
    }
  }

  return (
    <PublicQrPageShell
      title="配件出库登记"
      description="扫码后直接登记出库信息。选择配件，填写出库数量和备注，提交后系统会自动扣减库存。"
      footer={
        submitted
          ? undefined
          : (
              <Button
                type="primary"
                size="large"
                block
                className="h-11 rounded-xl"
                loading={createMutation.isPending}
                disabled={!hasOptions || isInitialLoading || !!optionsError}
                onClick={() => formRef?.submit()}
              >
                确认登记
              </Button>
            )
      }
    >
      {submitted
        ? (
            <Result
              status="success"
              title="登记成功"
              subTitle={(
                <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                  <div>{submitted.partLabel}</div>
                  <div>
                    出库数量：{submitted.quantity}，备注：{submitted.remarks}
                  </div>
                </div>
              )}
              extra={(
                <Button
                  type="primary"
                  size="large"
                  className="h-11 rounded-xl px-6"
                  onClick={() => {
                    setSubmitted(null)
                  }}
                >
                  继续登记
                </Button>
              )}
            />
          )
        : (
            <>
              <div className="mb-4 border-b border-divider pb-3">
                <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  现场扫码后填写
                </div>
              </div>

              {isInitialLoading
                ? (
                    <div className="flex min-h-64 items-center justify-center">
                      <Spin size="large" description="正在加载配件库存" />
                    </div>
                  )
                : optionsError
                  ? (
                      <Alert
                        type="error"
                        showIcon
                        title="配件列表加载失败"
                        description="请检查网络后重试。"
                        action={(
                          <Button size="small" onClick={() => refetchOptions()}>
                            重试
                          </Button>
                        )}
                      />
                    )
                  : !hasOptions
                      ? (
                          <Alert
                            type="warning"
                            showIcon
                            title="暂未配置可出库的配件库存"
                            description="请联系管理员先在后台维护配件库存后，再重新扫码登记。"
                          />
                        )
                      : (
                          <Form
                            form={form}
                            layout="vertical"
                            size="large"
                            onFinish={values => void handleFinish(values)}
                            disabled={createMutation.isPending}
                          >
                            <Form.Item
                              name="inventory_id"
                              label="配件资料"
                              rules={[{ required: true, message: '请选择配件' }]}
                            >
                              <Select
                                showSearch={{ filterOption: false, onSearch: setKeyword }}
                                options={selectOptions}
                                loading={isOptionsFetching}
                                placeholder="按名称、规格、材质或采购厂家查找配件"
                                onChange={() => {
                                  form.validateFields(['quantity']).catch(() => undefined)
                                }}
                              />
                            </Form.Item>

                            {selected && (
                              <div className="mb-4 space-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                                <div>
                                  类别：{selected.part_category} / 类型：{selected.item_type}
                                </div>
                                <div>颜色：{formatJintanColor(selected.color)}</div>
                                <div>
                                  名称：{selected.part_name} / 规格：
                                  {selected.specification || '-'}
                                </div>
                                <div>
                                  材质：{selected.material || '-'} / 采购厂家：
                                  {selected.supplier || '-'}
                                </div>
                                <div>当前库存：{selected.quantity}</div>
                              </div>
                            )}

                            <Form.Item
                              name="quantity"
                              label="出库数量"
                              dependencies={['inventory_id']}
                              rules={[
                                { required: true, message: '请输入出库数量' },
                                {
                                  type: 'integer',
                                  min: 1,
                                  message: '出库数量必须为正整数',
                                },
                                {
                                  validator: async (_rule, value: number) => {
                                    const currentOption = options.find(
                                      option =>
                                        option.id === form.getFieldValue('inventory_id'),
                                    )
                                    if (
                                      currentOption
                                      && Number.isInteger(value)
                                      && value > currentOption.quantity
                                    ) {
                                      throw new Error(
                                        `库存不足，当前库存为 ${currentOption.quantity}`,
                                      )
                                    }
                                  },
                                },
                              ]}
                            >
                              <InputNumber
                                min={1}
                                precision={0}
                                inputMode="numeric"
                                className="w-full"
                                placeholder="请输入出库数量"
                              />
                            </Form.Item>

                            <Form.Item
                              name="remarks"
                              label="备注"
                              className="mb-0!"
                              rules={[{ max: 500, message: '备注不能超过 500 个字符' }]}
                            >
                              <Input.TextArea
                                rows={3}
                                maxLength={500}
                                placeholder="备注（可选）"
                              />
                            </Form.Item>
                          </Form>
                        )}

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-xs leading-5 text-slate-600 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-400">
                提交后会立即写入配件出库并扣减库存。请确认配件、数量和备注无误，再点击底部“确认登记”。
              </div>
            </>
          )}
    </PublicQrPageShell>
  )
}
