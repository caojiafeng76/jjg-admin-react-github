import { render } from '@testing-library/react'
import { ConfigProvider } from 'antd'
import { describe, expect, it, vi } from 'vitest'

import ToolingFixtureForm from './ToolingFixtureForm'

describe('ToolingFixtureForm', () => {
  it('renders every requested fixture data field', () => {
    const { container } = render(
      <ConfigProvider>
        <ToolingFixtureForm
          isSubmitting={false}
          onFinish={vi.fn()}
          setFormRef={vi.fn()}
        />
      </ConfigProvider>,
    )

    const labels = [
      '工装模具编号',
      '类别',
      '适用产品图号',
      '产品名称',
      '适用设备',
      '存放位置',
      '制作日期',
      '制作厂商',
      '状态',
      '上次保养日期',
      '保养周期（天）',
      '责任人',
      '备注',
    ]

    labels.forEach((label) => {
      expect(container).toHaveTextContent(label)
    })
  })
})
