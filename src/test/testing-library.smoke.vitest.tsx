import type { ReactElement } from 'react'

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function SmokeButton(): ReactElement {
  return <button type="button">测试通过</button>
}

describe('testing library setup', () => {
  it('renders React components in jsdom', () => {
    render(<SmokeButton />)

    expect(screen.getByRole('button', { name: '测试通过' })).toBeInTheDocument()
  })
})
