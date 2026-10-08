import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Result,
  Select,
  Spin,
  Typography,
  type FormInstance,
} from 'antd'

import type { JintanPartsStockOutFormValues } from '@/services/apiJintanPartsStockOut'
import { usePublicJintanPartsInventoryOptions } from '../PartsInventory/useJintanPartsInventory'
import { useCreatePublicJintanPartsStockOut } from './useJintanPartsStockOut'

const { Paragraph, Title } = Typography

const displayFontStyle = {
  fontFamily: "'STSong', 'SimSun', 'Noto Serif SC', serif",
}

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
  const selected = options.find((option) => option.id === selectedInventoryId)

  useEffect(() => {
    setFormRef(form)
  }, [form])

  const selectOptions = useMemo(
    () =>
      options.map((option) => ({
        value: option.id,
        label: `${option.part_name} / ${option.specification || '无规格'}（库存 ${option.quantity}）`,
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
        (item) => item.id === payload.inventory_id,
      )
      setSubmitted({
        partLabel: submittedOption
          ? `${submittedOption.part_name} / ${submittedOption.specification || '无规格'}`
          : '配件出库',
        quantity: payload.quantity,
        remarks: payload.remarks || '无',
      })
      form.resetFields()
      setKeyword('')
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '登记失败，请稍后重试',
      )
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_28%),linear-gradient(180deg,#f4fbf7_0%,#ffffff_42%,#e8efe9_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_28%),linear-gradient(180deg,#0f172a_0%,#111827_42%,#0b1220_100%)] dark:text-slate-100">
      <div className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col overflow-y-auto px-4 pt-5 pb-[calc(theme(spacing.32)+env(safe-area-inset-bottom))] sm:px-6 sm:pt-7">
        <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 px-5 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-6 dark:border-slate-700/80 dark:bg-slate-900/80">
          <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
          <div className="absolute bottom-0 -left-8 h-20 w-20 rounded-full bg-slate-200/50 blur-3xl dark:bg-slate-800/40" />

          <div className="relative">
            <div className="text-[11px] font-semibold tracking-[0.32em] text-slate-400 uppercase dark:text-slate-500">
              Jintan Parts Stock Out
            </div>
            <Title
              level={2}
              style={{ ...displayFontStyle, marginTop: 14, marginBottom: 8 }}
            >
              配件出库登记
            </Title>
            <Paragraph className="mb-0 text-sm leading-6 text-slate-600 dark:text-slate-400">
              扫码后直接登记出库信息。选择配件，填写出库数量和备注，提交后系统会自动扣减库存。
            </Paragraph>
          </div>
        </section>

        {submitted ? (
          <Card className="mt-4 rounded-[28px] border-slate-200/80 bg-white/92 shadow-[0_22px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/80 dark:bg-slate-900/90">
            <Result
              status="success"
              title="登记成功"
              subTitle={
                <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
                  <div>{submitted.partLabel}</div>
                  <div>
                    出库数量：{submitted.quantity}，备注：{submitted.remarks}
                  </div>
                </div>
              }
              extra={
                <Button
                  type="primary"
                  size="large"
                  className="h-11 rounded-2xl px-6"
                  onClick={() => {
                    setSubmitted(null)
                  }}
                >
                  继续登记
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            <Card className="mt-4 rounded-[28px] border-slate-200/80 bg-white/92 shadow-[0_22px_60px_rgba(15,23,42,0.08)] dark:border-slate-700/80 dark:bg-slate-900/90">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase dark:text-slate-500">
                    Open H5 Form
                  </div>
                  <div className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                    现场扫码后填写
                  </div>
                </div>
                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  无需登录
                </div>
              </div>

              {isInitialLoading ? (
                <div className="flex min-h-80 items-center justify-center">
                  <div className="flex flex-col items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <Spin size="large" />
                    <span>正在加载配件库存</span>
                  </div>
                </div>
              ) : optionsError ? (
                <Alert
                  type="error"
                  showIcon
                  title="配件列表加载失败"
                  description="请检查网络后重试。"
                  action={
                    <Button size="small" onClick={() => refetchOptions()}>
                      重试
                    </Button>
                  }
                />
              ) : !hasOptions ? (
                <Alert
                  type="warning"
                  showIcon
                  title="暂未配置可出库的配件库存"
                  description="请联系管理员先在后台维护配件库存后，再重新扫码登记。"
                />
              ) : (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={(values) => void handleFinish(values)}
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
                      size="large"
                      onChange={() => {
                        form.validateFields(['quantity']).catch(() => undefined)
                      }}
                    />
                  </Form.Item>

                  {selected && (
                    <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-700 dark:text-slate-200">
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
                            (option) =>
                              option.id === form.getFieldValue('inventory_id'),
                          )
                          if (
                            currentOption &&
                            Number.isInteger(value) &&
                            value > currentOption.quantity
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
                      className="w-full"
                      size="large"
                      placeholder="请输入出库数量"
                    />
                  </Form.Item>

                  <Form.Item
                    name="remarks"
                    label="备注"
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
            </Card>

            <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-slate-950/3 px-4 py-4 text-sm leading-6 text-slate-600 shadow-[0_18px_40px_rgba(15,23,42,0.05)] dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-400">
              提交后会立即写入配件出库并扣减库存。请确认配件、数量和备注无误，再点击底部“确认登记”。
            </div>
          </>
        )}
      </div>

      {!submitted && (
        <div className="sticky bottom-0 z-40 border-t border-white/70 bg-white/92 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+14px)] backdrop-blur-xl sm:px-6 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto w-full max-w-xl">
            <Button
              type="primary"
              size="large"
              block
              className="h-12 rounded-2xl"
              loading={createMutation.isPending}
              disabled={!hasOptions || isInitialLoading || !!optionsError}
              onClick={() => formRef?.submit()}
            >
              确认登记
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
