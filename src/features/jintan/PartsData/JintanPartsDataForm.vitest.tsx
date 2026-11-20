import type { FormInstance } from 'antd'
import type { JintanPartsDataFormValues } from '@/services/apiJintanPartsData'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import JintanPartsDataForm from './JintanPartsDataForm'

describe('金檀木业配件资料表单', () => {
  afterEach(cleanup)

  it('新建时类别默认选中「通用」，可选 140U / 220U / 通用', async () => {
    let form: FormInstance<JintanPartsDataFormValues> | undefined
    const onFinish = vi.fn()

    render(
      <JintanPartsDataForm
        onFinish={onFinish}
        setFormRef={(instance) => {
          form = instance
        }}
        isSubmitting={false}
      />,
    )

    expect(screen.getByRole('radio', { name: '通用' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '140U' })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: '220U' })).not.toBeChecked()

    act(() => {
      form?.setFieldValue('part_name', '滑轮')
      form?.submit()
    })

    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          part_category: '通用',
          item_type: 'A',
          part_name: '滑轮',
        }),
      ),
    )

    fireEvent.click(screen.getByRole('radio', { name: '140U' }))
    act(() => form?.submit())

    await waitFor(() =>
      expect(onFinish).toHaveBeenLastCalledWith(
        expect.objectContaining({
          part_category: '140U',
          part_name: '滑轮',
        }),
      ),
    )
  })

  it('编辑时回填已有类别并允许切换', async () => {
    let form: FormInstance<JintanPartsDataFormValues> | undefined
    const onFinish = vi.fn()

    render(
      <JintanPartsDataForm
        onFinish={onFinish}
        setFormRef={(instance) => {
          form = instance
        }}
        isSubmitting={false}
        initialValues={{
          part_category: '220U',
          item_type: 'B',
          part_name: '导轨',
          specification: '2m',
          color: '',
          material: '',
          supplier: '',
          remarks: '',
        }}
      />,
    )

    expect(screen.getByRole('radio', { name: '220U' })).toBeChecked()

    fireEvent.click(screen.getByRole('radio', { name: '通用' }))
    act(() => form?.submit())

    await waitFor(() =>
      expect(onFinish).toHaveBeenCalledWith(
        expect.objectContaining({
          part_category: '通用',
          item_type: 'B',
          part_name: '导轨',
        }),
      ),
    )
  })
})
